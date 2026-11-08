# Ferramentas do estúdio

Instalação (uma vez por máquina): `cd ferramentas && npm install`, depois `node ferramentas/verificar.mjs`.

| Comando (na raiz do repositório) | O que faz |
|---|---|
| `node ferramentas/verificar.mjs` | Confere Node, Python, ffmpeg (libx264/aac/loudnorm), Three.js e WebGL no Chromium. |
| `node ferramentas/still.mjs projetos/<nome> 0 1.5 4` | PNG 1080x1920 do quadro exato de cada instante. `--n 6` espalha 6 instantes. |
| `node ferramentas/render.mjs projetos/<nome>` | MP4 1080x1920, 30 fps, H.264 High, yuv420p, BT.709. |
| `node ferramentas/render.mjs projetos/<nome> --audio narracao.wav` | Idem, com AAC 48 kHz a -14 LUFS / -1 dBTP (sem cortar o áudio). Um `narracao.wav` na pasta do projeto é usado sozinho. |
| `node ferramentas/servidor.mjs projetos/<nome>` | Prévia no navegador: `http://localhost:5173/?play` (loop) ou `?t=2.5` (quadro fixo). |

### Narração → cenas → folha de prévia

| Comando | O que faz |
|---|---|
| `python3 -m venv ferramentas/.venv && ferramentas/.venv/bin/pip install faster-whisper==1.1.1 requests` | Prepara a transcrição (uma vez). Os modelos vêm do huggingface.co (precisa estar liberado na rede do ambiente). |
| `ferramentas/.venv/bin/python ferramentas/transcrever.py projetos/<nome>/narracao.mp3 projetos/<nome>/transcricao.json` | Tempo de cada palavra (Whisper large-v3-turbo, CPU), ajustado pelas pausas reais do áudio. Só lê o áudio. |
| `node ferramentas/folha.mjs projetos/<nome>` | Folha de prévia: um still por cena com tempo, fala, imagem, etiquetas e som (`saida/previa/folha.png`). |

Na página, `carregarNarracao()` (`motor/narracao.js`) dá `w('palavra', n)` (início da n-ésima ocorrência) e
`legenda(t)` (1 a 3 palavras, palavra falada acesa). `registrar({ cenas })` expõe a lista de cenas para a folha;
`registrar({ renderizar })` permite render próprio (ex.: plano dividido na linha d'água).

Saídas vão para `projetos/<nome>/saida/` e nunca sobrescrevem: `nome.mp4`, `nome_v2.mp4`, `nome_v3.mp4`...

## Estilo do estúdio (`motor/estilo.js`)

A ficha "Corte na hora azul" do CLAUDE.md em código: `PALETA`, `criarCeu`, `luzHoraAzul`,
`criarCorte` (corte em caixa: `corte.cortar(mesh, HACHURA.estrutura|metal)`, `corte.abrir(0..1)`;
peças paradas são cortadas com hachura, peças que se movem ficam inteiras) e `criarTexto`
(`legenda(palavras, acesa)`, `etiquetas([{ponto, texto, dx, dy}], camera)`, `escala(ponto, camera)`).
Precisa de `renderer.localClippingEnabled = true`. Exemplo completo: `projetos/estilo`.

## Como é um projeto

`projetos/<nome>/index.html` com Three.js (veja `projetos/teste`):

```js
import { criarEstudio, registrar } from '/motor/estudio.js';
const { THREE, renderer, cena, camera } = criarEstudio({ fundo: 0x0a1430 });
// ...monta a cena...
registrar({ duracao: 5, renderer, cena, camera, desenhar(t) { /* tudo em função de t */ } });
```

`registrar` expõe `window.DURATION` e `window.seek(t)`. Em `desenhar(t)` nada de relógio,
timers ou `requestAnimationFrame`: o mesmo `t` tem que dar sempre o mesmo quadro.
`/three/` aponta para `ferramentas/node_modules/three` (addons em `three/addons/`).

O render abre a página no Chromium sem janela (WebGL por software, SwiftShader), chama
`seek(i/30)` para cada quadro, captura o PNG e manda direto para o ffmpeg.
