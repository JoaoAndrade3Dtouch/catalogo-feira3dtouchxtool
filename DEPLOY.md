# Subir o catálogo na Vercel e gravar o QR no acrílico

Duas partes, nesta ordem. **A segunda depende da primeira**: o endereço só é
definitivo depois que o deploy sobe, e o acrílico é irreversível.

---

## Parte 1 — Vercel

O site é estático: `index.html` mais a pasta `img/`. Não tem build, não tem
servidor. A Vercel serve isso direto.

### 1. Instalar a CLI da Vercel

Uma vez só, na máquina:

```bash
npm install -g vercel
```

### 2. Entrar na conta

```bash
vercel login
```

Ele manda um e-mail com link de confirmação. Clica no link e volta pro terminal.

### 3. Primeiro deploy (de teste)

Da pasta do catálogo:

```bash
cd "C:\Users\João Andrade\catalogo-expo3d"
vercel
```

Ele vai perguntar. As respostas que importam:

| Pergunta | Resposta |
|---|---|
| Set up and deploy? | `y` |
| Which scope? | sua conta |
| Link to existing project? | `n` |
| **What's your project's name?** | **`catalogo-3dtouch`** |
| In which directory is your code? | `./` |
| Want to modify these settings? | `n` |

> ⚠️ **O nome do projeto é o que vira o endereço.** A pasta local se chama
> `catalogo-expo3d`, então a Vercel vai sugerir esse nome — **não aceite**.
> Digite `catalogo-3dtouch`, senão o endereço sai `catalogo-expo3d.vercel.app`
> e o QR que já está gerado não serve.

### 4. Deploy de produção

O comando acima cria um endereço de pré-visualização. O definitivo sai com:

```bash
vercel --prod
```

### 5. Confirmar o endereço — antes de gravar qualquer coisa

O terminal imprime o endereço de produção. Ele **precisa** ser exatamente:

```
https://catalogo-3dtouch.vercel.app
```

Abre no celular e confere que o catálogo carrega.

Se o nome `catalogo-3dtouch` já estiver ocupado por outra conta, a Vercel devolve
outro endereço (com sufixo). **Nesse caso o QR já gerado não vale** — pula para
"Se o endereço mudar", no fim deste arquivo.

### 6. Atualizar o site depois

Toda vez que mudar o `index.html` ou as imagens:

```bash
vercel --prod
```

O endereço não muda. O QR gravado continua valendo para sempre.

### Alternativa: GitHub em vez da CLI

Se preferir que cada `git push` publique sozinho:

1. `git init && git add . && git commit -m "catálogo 3D Touch"`
2. Cria um repositório no GitHub e dá `git push`
3. Em vercel.com → **Add New → Project → Import** o repositório
4. Em **Project Name**, digita `catalogo-3dtouch`
5. Framework Preset: **Other**. Sem build command, sem output directory.
6. **Deploy**

O `.gitignore` e o `.vercelignore` já estão prontos: só `index.html`, `img/` e o
`vercel.json` vão para o ar. Os scripts de geração ficam de fora.

---

## Parte 2 — Gravar o QR no acrílico

Os arquivos estão em `qr-laser/`, gerados para
`https://catalogo-3dtouch.vercel.app`:

| Arquivo | Quando usar |
|---|---|
| `qr-laser.svg` | QR normal — os módulos são o que vai ser gravado |
| `qr-laser-invertido.svg` | O negativo — o **fundo** é o que vai ser gravado |
| `qr-laser-placa.svg` | Placa 90 × 120 mm: linha de corte + QR, sobra faixa para texto |
| `previa-placa.png` | Só para olhar antes de mandar para a máquina |

Todos com o QR em **60 mm**, 33 × 33 módulos, correção de erro Q (aguenta 25% de
dano). Cada módulo fica com **1,46 mm** — folgado para qualquer laser xTool.

### Qual dos dois arquivos, normal ou invertido

A regra é uma só: **o que fica mais claro depois de gravar tem que ser o fundo do
QR.** Leitor de QR espera módulo escuro sobre fundo claro.

| Material | O que a gravação faz | Arquivo |
|---|---|---|
| Acrílico preto | clareia (fica fosco esbranquiçado) | **invertido** |
| Laminado bicolor, capa preta / miolo branco | clareia (revela o miolo) | **invertido** |
| Laminado bicolor, capa branca / miolo preto | escurece | **normal** |
| Madeira clara, couro claro | escurece (queima) | **normal** |
| Metal pintado / anodizado claro | escurece | **normal** |

**Acrílico transparente não é boa ideia para QR.** A gravação vira fosco sobre
transparente — quase nenhum contraste para a câmera. Se for transparente mesmo,
grave o fundo (arquivo invertido) e cole uma chapa branca atrás; ou use acrílico
preto, que é o caminho mais direto.

### No xTool Studio (XCS)

1. **Importar** → escolhe o SVG. Ele entra em 60 mm (ou 90 × 120 mm na versão
   placa) — o arquivo já traz a medida em milímetro, não precisa redimensionar.
2. O QR vem como um caminho preenchido. Em **Processing**, escolhe **Gravar /
   Fill** (não "Score", não "Cut").
3. Na versão placa, o retângulo vermelho é a linha de corte: seleciona só ele e
   põe **Cortar / Cut**. O preto continua em Fill.
4. **Faça o teste de material** antes. Grava um QR de teste num pedaço de sobra e
   **lê com o celular** — de perto e de uns 40 cm. Só depois manda a peça boa.

### Cuidados que fazem o QR funcionar

- **A borda branca em volta faz parte do código.** Ela já está no arquivo (4
  módulos). Não corte rente ao QR, não encoste texto nem logo nela.
- **Não deforme.** Se mexer no tamanho, mexa com proporção travada. QR esticado
  não lê.
- **Tamanho mínimo.** 60 mm lê de longe. Se quiser menor, regere com o tamanho
  certo em vez de reduzir na máquina:
  ```bash
  node qr-laser.js "https://catalogo-3dtouch.vercel.app" 40 Q
  ```
  Abaixo de 30 mm começa a ficar exigente com a câmera.
- **Teste com o celular sujo de dedo**, na luz do ambiente onde a placa vai ficar.
  Acrílico brilha e o reflexo atrapalha mais que o tamanho.

---

## Se o endereço mudar

Um comando refaz os três SVG e confere, decodificando o próprio vetor, que o QR
aponta para o lugar certo. Se não bater, ele falha em vez de gerar arquivo errado:

```bash
node qr-laser.js "https://o-endereco-certo" 60 Q
```

E para refazer também o cartaz A4 de papel:

```bash
node qr.js "https://o-endereco-certo"
```

As duas dependências (`qrcode`, `jsqr`, `sharp`) vêm de
`../catalogo-xtool/node_modules`. Se der "module not found":

```bash
NODE_PATH="../catalogo-xtool/node_modules" node qr-laser.js "https://..." 60 Q
```
