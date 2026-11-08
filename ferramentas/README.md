# Ferramentas do estúdio

Instalação (uma vez por máquina): `cd ferramentas && npm install`, depois `node ferramentas/verificar.mjs`.

| Comando (na raiz do repositório) | O que faz |
|---|---|
| `node ferramentas/verificar.mjs` | Confere Node, Python, ffmpeg (libx264/aac/loudnorm), Three.js e WebGL no Chromium. |
| `node ferramentas/still.mjs projetos/<nome> 0 1.5 4` | PNG 1080x1920 do quadro exato de cada instante. `--n 6` espalha 6 instantes. |
| `node ferramentas/render.mjs projetos/<nome>` | MP4 1080x1920, 30 fps, H.264 High, yuv420p, BT.709. |
| `node ferramentas/render.mjs projetos/<nome> --audio narracao.wav` | Idem, com AAC 48 kHz a -14 LUFS / -1 dBTP (sem cortar o áudio). Um `narracao.wav` na pasta do projeto é usado sozinho. |
| `node ferramentas/servidor.mjs projetos/<nome>` | Prévia no navegador: `http://localhost:5173/?play` (loop) ou `?t=2.5` (quadro fixo). |

Saídas vão para `projetos/<nome>/saida/` e nunca sobrescrevem: `nome.mp4`, `nome_v2.mp4`, `nome_v3.mp4`...

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
