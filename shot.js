// Prints do catalogo para conferencia.
//   node shot.js <largura> <alvo[,alvo...]>
// alvo = id de secao (u1, o1, f2, p2s, a2l, snapmaker...) ou "topo" para o dobra inicial.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const SAIDA = path.join(__dirname, 'shots');
fs.mkdirSync(SAIDA, { recursive: true });

(async () => {
  const largura = Number(process.argv[2] || 390);
  const alvos = (process.argv[3] || 'topo').split(',');

  const nav = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const p = await nav.newPage();
  await p.setViewport({ width: largura, height: 900, deviceScaleFactor: 2 });
  await p.goto('http://localhost:4321', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // desliga a revelacao e a rolagem suave, e forca o carregamento das imagens lazy
  await p.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelectorAll('.reveal').forEach((e) => e.classList.add('on'));
    document.querySelectorAll('img[loading]').forEach((i) => i.removeAttribute('loading'));
  });
  await p.evaluate(() => Promise.all(
    [...document.images].map((i) => (i.complete ? null : i.decode().catch(() => null)))
  ));
  try { await p.evaluate(() => document.fonts.ready); } catch (e) { /* fonte offline */ }
  await new Promise((r) => setTimeout(r, 800));

  for (const a of alvos) {
    const arq = path.join(SAIDA, `${largura}-${a}.png`);
    if (a === 'topo') {
      await p.screenshot({ path: arq });
    } else {
      const el = await p.$(a.startsWith('.') ? a : '#' + a);
      if (!el) { console.log('nao achei #' + a); continue; }
      await el.evaluate((n) => n.scrollIntoView());
      await new Promise((r) => setTimeout(r, 300));
      await el.screenshot({ path: arq });
    }
    console.log('ok', path.basename(arq), fs.statSync(arq).size / 1024 | 0, 'KB');
  }
  await nav.close();
})().catch((e) => { console.error('ERRO', e.message); process.exit(1); });
