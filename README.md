# Catálogo 3D Touch

Catálogo de máquinas da 3D Touch: Snapmaker, xTool e Bambu Lab. Nasceu do folder
impresso da EXPO 3D BR (`FOLDER (FRENTE).pdf`), mas **não tem mais nenhum vínculo
com feira** — nem no texto, nem nas logos. Foco em xTool e Snapmaker: elas vêm
primeiro e com card completo; a Bambu Lab fecha a página.

Dez máquinas com card completo:

| # | Marca | Máquina | Origem do conteúdo |
|---|---|---|---|
| 1 | Snapmaker | U1 | folder |
| 2 | xTool | F2 Ultra UV | catálogo xTool (ref 3472) |
| 3 | xTool | F2 Ultra | catálogo xTool (ref 3451) |
| 4 | xTool | F2 | folder + ficha do catálogo xTool (ref 3471) |
| 5 | xTool | O1 Omni | folder + ficha do catálogo xTool (ref 3678) |
| 6 | xTool | P3 | catálogo xTool (ref 3446) |
| 7 | xTool | M2 Color Craft | catálogo xTool (ref 3674 / 3675) |
| 8 | xTool | Apparel Printer | catálogo xTool |
| 9 | Bambu Lab | P2S | folder |
| 10 | Bambu Lab | A2L | folder |

Mais sete modelos Bambu Lab em grade compacta (foto + uma linha), no fim da
seção da marca: H2D, H2C, H2S, X2D, P1S, A1 e A1 mini. Dados e fotos vieram de
`3dtouch-automacoes/comercial/portal-revenda/backend` (scraping da loja Bambu +
produtos do Sankhya). Total: 17 máquinas.

Três níveis de profundidade, e a diferença é proposital — é o material que existe
de cada uma:

- **folder** → grade de destaques (um quadrinho por recurso)
- **catálogo xTool** → mostruário de fotos grandes de aplicação
- **loja Bambu Lab** → card compacto com foto e uma linha

A "OMNI" e a "O1" do folder são a mesma máquina (xTool O1 Omni), então
viraram um card só, com selo de lançamento.

## Arquivos

```
index.html          o site (imagens ligadas por caminho, para publicar em servidor)
img/                74 imagens: as do folder (extraídas do PDF) e as fotos xTool
dist/artifact.html  o mesmo site com as imagens embutidas (o que virou Artifact)
qr/                 QR em png e svg + cartaz A4 para imprimir em papel
qr-laser/           QR vetorizado para gravar a laser (xTool Studio)
vercel.json         config do deploy estatico
.vercelignore       so index.html + img/ sobem para a Vercel
DEPLOY.md           passo a passo: subir na Vercel e gravar o acrilico
servidor.js         servidor estático para ver localmente
build.js            gera o dist/artifact.html
shot.js             tira prints para conferência
qr.js               gera o QR e o cartaz de papel
qr-laser.js         gera o QR vetorizado para laser, e confere decodificando
shots/              prints de conferência
```

## Rodar localmente

```bash
node servidor.js
```

Abre em `http://localhost:4321`.

## Publicar

Passo a passo completo em [DEPLOY.md](DEPLOY.md) — Vercel e gravacao a laser.


Como Artifact (o que já está no ar):

```bash
node build.js
```

E republicar `dist/artifact.html` no mesmo Artifact.

Em servidor próprio (Netlify, hospedagem da 3D Touch, etc.): sobe `index.html`
e a pasta `img/`. É tudo estático, não precisa de build.

## Trocar a URL do QR

Se o site mudar de endereço, é um comando só — ele gera o png, o svg e o
cartaz A4 de novo, e confere se o QR decodifica para a URL certa:

```bash
node qr.js https://o-novo-endereco.com.br
```

Dependências (`qrcode`, `jsqr`, `sharp`, `puppeteer-core`) estão reaproveitadas
de `../catalogo-xtool/node_modules`; rode com
`NODE_PATH="../catalogo-xtool/node_modules"` ou instale aqui.

## Design

Paleta e gradiente tirados do próprio folder:
`#47318D → #973086 → #C43C70 → #EE5755 → #F37040`. Cada marca usa uma parada
desse gradiente como cor de acento (Snapmaker roxo, xTool magenta, Bambu Lab
laranja). Tipos: Archivo (nomes das máquinas), Instrument Sans (texto),
IBM Plex Mono (rótulos e fichas). Tema claro único, de propósito — o folder é
branco e as logos das marcas são pretas.
