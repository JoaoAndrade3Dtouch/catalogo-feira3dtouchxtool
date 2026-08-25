// Gera os arquivos de QR Code do catalogo e confere se eles decodificam
// para a URL certa.
//   node qr.js <url>
// Sai em qr/: qr-catalogo.png, qr-catalogo.svg e cartaz-qr.pdf (A4).
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const jsQR = require('jsqr');
const sharp = require('sharp');
const puppeteer = require('puppeteer-core');

const URL = process.argv[2];
if (!URL) { console.error('uso: node qr.js <url>'); process.exit(1); }

const RAIZ = __dirname;
const SAIDA = path.join(RAIZ, 'qr');
fs.mkdirSync(SAIDA, { recursive: true });

const OPCOES = { errorCorrectionLevel: 'M', margin: 2, color: { dark: '#14121A', light: '#FFFFFF' } };

// A logo do cartaz vai embutida, senao o Chrome nao acha o arquivo no PDF.
function dataUri(rel) {
  const buf = fs.readFileSync(path.join(RAIZ, rel));
  return `data:image/webp;base64,${buf.toString('base64')}`;
}

async function confere(arquivoPng) {
  const { data, info } = await sharp(arquivoPng)
    .resize(600).flatten({ background: '#fff' }).toColourspace('srgb').ensureAlpha()
    .raw().toBuffer({ resolveWithObject: true });
  const lido = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  if (!lido) throw new Error('o QR gerado nao decodificou');
  if (lido.data !== URL) throw new Error(`o QR aponta para ${lido.data}, nao para ${URL}`);
  return lido.data;
}

const cartaz = (svgQr) => `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&family=IBM+Plex+Mono:wght@400;500&family=Instrument+Sans:wght@400..700&display=swap">
<style>
  @page { size: A4; margin: 0; }
  *,*::before,*::after{box-sizing:border-box}
  body{
    margin:0;width:210mm;height:297mm;
    background:#fff;color:#14121A;
    font-family:"Instrument Sans",Arial,sans-serif;
    display:flex;flex-direction:column;
  }
  .barra{height:9mm;background:linear-gradient(90deg,#47318D 0%,#973086 26%,#C43C70 52%,#EE5755 78%,#F37040 100%)}
  .miolo{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;padding:16mm 18mm 0}
  .marcas{display:flex;align-items:center;gap:8mm;margin-bottom:14mm}
  .marcas img{height:15mm;width:auto}
  .eyebrow{
    font-family:"IBM Plex Mono",monospace;font-size:10pt;letter-spacing:.18em;
    text-transform:uppercase;color:#8D879A;margin:0;
  }
  h1{
    font-family:"Archivo",Arial,sans-serif;
    font-variation-settings:"wdth" 108,"wght" 780;
    font-size:40pt;line-height:.95;letter-spacing:-.025em;
    margin:5mm 0 0;max-width:150mm;
  }
  h1 em{
    font-style:normal;
    background:linear-gradient(90deg,#47318D,#973086,#C43C70,#EE5755,#F37040);
    -webkit-background-clip:text;background-clip:text;color:transparent;
  }
  .sub{font-size:14pt;color:#565064;margin:6mm 0 0;max-width:130mm}
  .qr{margin:12mm 0 0;padding:6mm;border:1px solid #E4DFEA;border-radius:6mm;background:#fff}
  .qr svg{width:68mm;height:68mm;display:block}
  .aponte{
    font-family:"Archivo",Arial,sans-serif;
    font-variation-settings:"wdth" 100,"wght" 700;
    font-size:17pt;margin:8mm 0 0;
  }
  .url{font-family:"IBM Plex Mono",monospace;font-size:8.5pt;color:#8D879A;margin:3mm 0 0;word-break:break-all;max-width:120mm}
  .lista{
    margin:10mm 0 12mm;padding:0;list-style:none;
    display:flex;flex-wrap:wrap;justify-content:center;gap:3mm;
  }
  .lista li{
    font-family:"IBM Plex Mono",monospace;font-size:9.5pt;
    padding:2.5mm 4mm;border-radius:99mm;background:#F6F4F8;color:#565064;
  }
</style></head>
<body>
  <div class="barra"></div>
  <div class="miolo">
    <div class="marcas">
      <img src="${dataUri('img/logo-3dtouch.webp')}" alt="3D Touch">
    </div>
    <p class="eyebrow">Catálogo de máquinas</p>
    <h1>Todas as máquinas da 3D Touch no seu <em>celular</em></h1>
    <p class="sub">Dezessete máquinas de Snapmaker, xTool e Bambu Lab — o que cada uma faz, em um minuto de leitura.</p>
    <div class="qr">${svgQr}</div>
    <p class="aponte">Aponte a câmera do celular</p>
    <p class="url">${URL}</p>
    <ul class="lista">
      <li>Snapmaker · 1 máquina</li>
      <li>xTool · 7 máquinas</li>
      <li>Bambu Lab · 9 máquinas</li>
    </ul>
  </div>
  <div class="barra"></div>
</body></html>`;

(async () => {
  const png = path.join(SAIDA, 'qr-catalogo.png');
  await QRCode.toFile(png, URL, { ...OPCOES, width: 1400 });
  const svg = await QRCode.toString(URL, { ...OPCOES, type: 'svg' });
  fs.writeFileSync(path.join(SAIDA, 'qr-catalogo.svg'), svg);

  console.log('conferido:', await confere(png));

  const html = cartaz(svg);
  fs.writeFileSync(path.join(SAIDA, 'cartaz-qr.html'), html);

  const nav = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true, args: ['--no-sandbox', '--disable-gpu'],
  });
  const p = await nav.newPage();
  await p.setContent(html, { waitUntil: 'domcontentloaded' });
  try { await p.evaluate(() => document.fonts.ready); } catch (e) { /* fonte offline */ }
  await new Promise((r) => setTimeout(r, 1200));
  await p.pdf({ path: path.join(SAIDA, 'cartaz-qr.pdf'), format: 'A4', printBackground: true });
  await p.screenshot({ path: path.join(SAIDA, 'cartaz-qr.png'), fullPage: true });
  await nav.close();

  for (const f of ['qr-catalogo.png', 'qr-catalogo.svg', 'cartaz-qr.pdf', 'cartaz-qr.png']) {
    console.log('ok', f, (fs.statSync(path.join(SAIDA, f)).size / 1024 | 0) + ' KB');
  }
})().catch((e) => { console.error('ERRO', e.message); process.exit(1); });
