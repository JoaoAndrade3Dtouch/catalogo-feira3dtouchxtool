// QR Code vetorizado para gravacao a laser (xTool Studio / XCS).
//
//   node qr-laser.js <url> [tamanho-mm] [correcao: L M Q H]
//
// Gera em qr-laser/:
//   qr-laser.svg            modulos escuros — para laminado bicolor ou pintura
//   qr-laser-invertido.svg  o negativo — para acrilico onde a gravacao clareia
//   qr-laser-placa.svg      placa com linha de corte + QR, sobra espaco para texto
//
// Cada arquivo sai com o QR como UM caminho fechado, com fill e sem stroke:
// e o que o XCS precisa para tratar como preenchimento (gravar), nao como corte.
// A geometria e a uniao real dos modulos — as bordas entre quadrados vizinhos
// somem, entao o laser nao passa duas vezes na mesma linha.
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const jsQR = require('jsqr');
const sharp = require('sharp');

const URL = process.argv[2];
const MM = Number(process.argv[3] || 60);
const EC = (process.argv[4] || 'M').toUpperCase();
if (!URL) {
  console.error('uso: node qr-laser.js <url> [tamanho-mm] [correcao: L M Q H]');
  process.exit(1);
}

const SAIDA = path.join(__dirname, 'qr-laser');
fs.mkdirSync(SAIDA, { recursive: true });

const ZONA = 4;   // zona de silencio, em modulos — o padrao QR pede 4
const CORRECAO = EC;   // Q ou H aguentam mais risco na peca, ao custo de mais modulos

// ---------------------------------------------------------------- matriz
const qr = QRCode.create(URL, { errorCorrectionLevel: CORRECAO });
const N = qr.modules.size;
const bits = qr.modules.data;
const escuro = (x, y) => x >= 0 && y >= 0 && x < N && y < N && bits[y * N + x] === 1;

const LADO = N + ZONA * 2;          // lado total em modulos
const desloca = ZONA;

// ---------------------------------------------------------------- uniao dos modulos
// Cada modulo escuro contribui com 4 arestas orientadas. Aresta que aparece nos
// dois sentidos e fronteira entre dois modulos vizinhos: as duas se cancelam.
// O que sobra e o contorno da area preenchida.
function contornos() {
  const arestas = new Map();
  const chave = (a, b) => `${a[0]},${a[1]}|${b[0]},${b[1]}`;
  const põe = (a, b) => {
    const inversa = chave(b, a);
    if (arestas.has(inversa)) arestas.delete(inversa);
    else arestas.set(chave(a, b), [a, b]);
  };
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (!escuro(x, y)) continue;
      const px = x + desloca, py = y + desloca;
      põe([px, py], [px + 1, py]);
      põe([px + 1, py], [px + 1, py + 1]);
      põe([px + 1, py + 1], [px, py + 1]);
      põe([px, py + 1], [px, py]);
    }
  }

  // liga as arestas soltas em lacos fechados
  const porInicio = new Map();
  for (const [a, b] of arestas.values()) {
    const k = `${a[0]},${a[1]}`;
    if (!porInicio.has(k)) porInicio.set(k, []);
    porInicio.get(k).push(b);
  }
  const lacos = [];
  const usada = new Set();
  for (const [a, b] of arestas.values()) {
    const k0 = `${a[0]},${a[1]}|${b[0]},${b[1]}`;
    if (usada.has(k0)) continue;
    const laco = [a];
    let atual = a, prox = b;
    while (true) {
      usada.add(`${atual[0]},${atual[1]}|${prox[0]},${prox[1]}`);
      laco.push(prox);
      if (prox[0] === a[0] && prox[1] === a[1]) break;
      const saidas = (porInicio.get(`${prox[0]},${prox[1]}`) || [])
        .filter((p) => !usada.has(`${prox[0]},${prox[1]}|${p[0]},${p[1]}`));
      if (!saidas.length) break;
      atual = prox; prox = saidas[0];
    }
    lacos.push(laco);
  }
  return lacos.map(simplifica);
}

// tira os pontos no meio de um trecho reto
function simplifica(laco) {
  const p = laco.slice(0, -1);
  const fora = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[(i - 1 + p.length) % p.length], b = p[i], c = p[(i + 1) % p.length];
    const colinear = (a[0] === b[0] && b[0] === c[0]) || (a[1] === b[1] && b[1] === c[1]);
    if (!colinear) fora.push(b);
  }
  return fora;
}

function paraD(lacos) {
  return lacos.map((l) =>
    'M' + l.map((p) => `${p[0]} ${p[1]}`).join('L') + 'Z').join('');
}

const D = paraD(contornos());

// ---------------------------------------------------------------- arquivos
const cab = (larg, alt) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${larg}mm" height="${alt}mm" ` +
  `viewBox="0 0 ${larg} ${alt}">`;

const escala = MM / LADO;   // 1 modulo, em mm
const grava = (dx = 0, dy = 0) =>
  `  <g id="gravar">\n` +
  `    <path fill="#000000" fill-rule="evenodd" stroke="none" ` +
  `transform="translate(${dx} ${dy}) scale(${escala})" d="${D}"/>\n  </g>`;

// 1. modulos escuros
const normal = [
  cab(MM, MM),
  '  <!-- QR para gravar: preenchimento, sem contorno. Zona de silencio inclusa. -->',
  grava(),
  '</svg>',
].join('\n');

// 2. negativo: grava o fundo, os modulos ficam na superficie original
const invertido = [
  cab(MM, MM),
  '  <!-- Negativo: grave o fundo. Para acrilico em que a gravacao clareia. -->',
  '  <g id="gravar">',
  `    <path fill="#000000" fill-rule="evenodd" stroke="none" d="M0 0H${MM}V${MM}H0Z` +
  `${D.replace(/M([\d.]+) ([\d.]+)/g, (m, x, y) => `M${(+x * escala).toFixed(4)} ${(+y * escala).toFixed(4)}`)
      .replace(/L([\d.]+) ([\d.]+)/g, (m, x, y) => `L${(+x * escala).toFixed(4)} ${(+y * escala).toFixed(4)}`)}"/>`,
  '  </g>',
  '</svg>',
].join('\n');

// 3. placa: linha de corte + QR, com faixa livre embaixo para texto no XCS
const PL = MM + 30, PA = MM + 60;
const placa = [
  cab(PL, PA),
  '  <!-- corte = vermelho, so contorno. gravar = preto, preenchido. -->',
  '  <g id="corte">',
  `    <rect x="1" y="1" width="${PL - 2}" height="${PA - 2}" rx="6" ` +
  `fill="none" stroke="#FF0000" stroke-width="0.2"/>`,
  '  </g>',
  grava(15, 15),
  '</svg>',
].join('\n');

const arquivos = {
  'qr-laser.svg': normal,
  'qr-laser-invertido.svg': invertido,
  'qr-laser-placa.svg': placa,
};
for (const [nome, conteudo] of Object.entries(arquivos)) {
  fs.writeFileSync(path.join(SAIDA, nome), conteudo);
}

// ---------------------------------------------------------------- conferencia
// Rasteriza o proprio SVG e le de volta. Se a geometria estiver errada, falha aqui.
async function confere(nome, inverter = false) {
  let img = sharp(path.join(SAIDA, nome), { density: 150, limitInputPixels: false })
    .flatten({ background: '#ffffff' });
  if (inverter) img = img.negate({ alpha: false });
  const { data, info } = await img
    .resize(700, null, { fit: 'inside' })
    .toColourspace('srgb').ensureAlpha()
    .raw().toBuffer({ resolveWithObject: true });
  const lido = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  if (!lido) throw new Error(`${nome}: nao decodificou`);
  if (lido.data !== URL) throw new Error(`${nome}: aponta para ${lido.data}`);
  return true;
}

(async () => {
  console.log(`URL         ${URL}`);
  console.log(`versao      ${qr.version} (${N}x${N} modulos, correcao ${CORRECAO})`);
  console.log(`tamanho     ${MM} mm — cada modulo fica com ${(MM / LADO).toFixed(2)} mm`);
  console.log(`caminhos    ${(D.match(/M/g) || []).length} contornos fechados`);
  for (const [nome, inverter] of [['qr-laser.svg', false],
                                  ['qr-laser-invertido.svg', true],
                                  ['qr-laser-placa.svg', false]]) {
    await confere(nome, inverter);
    const kb = (fs.statSync(path.join(SAIDA, nome)).size / 1024).toFixed(1);
    console.log(`conferido   ${nome} (${kb} KB)`);
  }
  // pre-visualizacao em png, so para olhar antes de mandar para a maquina
  await sharp(path.join(SAIDA, 'qr-laser-placa.svg'), { density: 150, limitInputPixels: false })
    .flatten({ background: '#ffffff' }).png()
    .toFile(path.join(SAIDA, 'previa-placa.png'));
  console.log('previa      previa-placa.png');
})().catch((e) => { console.error('ERRO', e.message); process.exit(1); });
