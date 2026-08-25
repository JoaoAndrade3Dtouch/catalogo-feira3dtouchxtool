// Servidor estatico simples para conferir o catalogo localmente.
const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const PORTA = process.env.PORT || 4321;
const TIPOS = {
  '.html':'text/html; charset=utf-8', '.webp':'image/webp', '.png':'image/png',
  '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.js':'text/javascript', '.css':'text/css',
  '.pdf':'application/pdf'
};

http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';
  const arq = path.join(RAIZ, path.normalize(rel).replace(/^([\/])+/, ''));
  if (!arq.startsWith(RAIZ)) { res.writeHead(403); return res.end('nao'); }
  fs.readFile(arq, (err, buf) => {
    if (err) { res.writeHead(404, {'Content-Type':'text/plain'}); return res.end('404'); }
    res.writeHead(200, {'Content-Type': TIPOS[path.extname(arq).toLowerCase()] || 'application/octet-stream'});
    res.end(buf);
  });
}).listen(PORTA, () => console.log('catalogo em http://localhost:' + PORTA));
