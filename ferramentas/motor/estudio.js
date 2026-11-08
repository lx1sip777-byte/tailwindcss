// Motor do estúdio (roda dentro da página).
// Uso no index.html de cada projeto:
//   import { criarEstudio } from '/motor/estudio.js';
//   const { renderer, cena, camera } = criarEstudio();
//   registrar({ duracao: 5, desenhar(t) { ... } });
// Regras: nada de relógio, timers ou requestAnimationFrame dentro de desenhar(t).
// Tudo o que aparece no quadro precisa ser função de t.
import * as THREE from 'three';

export const LARGURA = 1080;
export const ALTURA = 1920;
export const FPS = 30;

export function criarEstudio({ fundo = 0x000000, fov = 35 } = {}) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true, // o quadro continua no canvas até a captura
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(1);
  renderer.setSize(LARGURA, ALTURA, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.id = 'quadro';
  document.body.appendChild(renderer.domElement);

  const cena = new THREE.Scene();
  cena.background = new THREE.Color(fundo);
  const camera = new THREE.PerspectiveCamera(fov, LARGURA / ALTURA, 0.1, 200);

  return { THREE, renderer, cena, camera };
}

// Registra o vídeo: expõe window.DURATION e window.seek(t).
// `preparar` (opcional) roda uma vez antes do primeiro quadro (carregar texturas, fontes etc).
export function registrar({ duracao, desenhar, renderer, cena, camera, preparar }) {
  let pronto = (async () => {
    if (preparar) await preparar();
    if (document.fonts) await document.fonts.ready;
  })();

  window.DURATION = duracao;
  window.FPS = FPS;
  window.seek = async (t) => {
    await pronto;
    const tt = Math.min(Math.max(t, 0), duracao);
    desenhar(tt);
    renderer.render(cena, camera);
    window.TEMPO_ATUAL = tt;
    return tt;
  };
  window.ESTUDIO_PRONTO = pronto.then(() => true);

  // Prévia no navegador comum: abra com ?play para tocar em loop.
  // (A captura nunca usa isto: ela chama seek(t) quadro a quadro.)
  const params = new URLSearchParams(location.search);
  if (params.has('play')) {
    const inicio = performance.now();
    const tocar = async () => {
      await window.seek(((performance.now() - inicio) / 1000) % duracao);
      requestAnimationFrame(tocar);
    };
    tocar();
  } else {
    window.seek(Number(params.get('t') || 0));
  }
}
