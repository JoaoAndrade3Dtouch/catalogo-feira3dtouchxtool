// Gera dist/artifact.html: o mesmo index.html, com todas as imagens embutidas
// como data URI. E o arquivo que vai para o Artifact (pagina publicada).
//   node build.js
const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const DIST = path.join(RAIZ, 'dist');
fs.mkdirSync(DIST, { recursive: true });

const TIPO = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

let html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
let embutidas = 0;
let bytes = 0;

html = html.replace(/(src|href)="(img\/[^"]+)"/g, (todo, attr, rel) => {
  const arq = path.join(RAIZ, rel);
  if (!fs.existsSync(arq)) { console.warn('faltando:', rel); return todo; }
  const buf = fs.readFileSync(arq);
  const tipo = TIPO[path.extname(arq).toLowerCase()];
  if (!tipo) return todo;
  embutidas++; bytes += buf.length;
  return `${attr}="data:${tipo};base64,${buf.toString('base64')}"`;
});

const saida = path.join(DIST, 'artifact.html');
fs.writeFileSync(saida, html);
console.log(`${embutidas} imagens embutidas (${(bytes / 1024 / 1024).toFixed(2)} MB originais)`);
console.log(`${saida} — ${(fs.statSync(saida).size / 1024 / 1024).toFixed(2)} MB`);
