// Estilo do estúdio: "Corte na hora azul".
// Tudo o que é marca registrada dos vídeos mora aqui, para todo projeto sair igual:
// paleta, céu da hora azul, corte com hachura creme, legenda, etiquetas finas e barra de escala.
import * as THREE from 'three';

export const PALETA = {
  // céu da hora azul (topo → horizonte)
  ceuTopo: '#18234a', ceuMeio: '#33507f', ceuHorizonte: '#7d82a0', brumaQuente: '#c99272',
  neblina: '#3a4a6c',
  // ambiente: tudo um pouco dessaturado e frio
  parede: '#d8d0c2', reboco: '#b9b2a6', telha: '#6b3b2e', madeira: '#2f5560', // porta verde-petróleo
  grama: '#3d5640', folha: '#2f4a3a', folhaClara: '#48654b', concreto: '#8d8a86', asfalto: '#2b2d33',
  // luz prática (luminária, poste, janela)
  luzQuente: '#ffc98a', janela: '#f2b56b',
  // por dentro
  latao: '#c9a25a', aco: '#9aa3ad', niquel: '#c7ccd2',
  // hachura dos cortes
  hachuraFundo: '#e2d8c2', hachuraLinha: '#a39276', // estrutura (parede, porta, batente)
  metalFundo: '#e6cf98', metalLinha: '#9c7c3a', // metal cortado
  // destaque: só a peça citada
  ambar: '#ffb547',
  // texto
  creme: '#f3ede0',
};

const cor = (hex) => new THREE.Color(hex);
// cores para shaders que escrevem direto na tela: valores em sRGB (sem conversão de espaço de cor)
const rgb = (hex) => { const c = new THREE.Color(hex).convertLinearToSRGB(); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };

// ---------- céu ----------
export function criarCeu(cena, raio = 120) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vDir;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453); }
      void main(){
        float y = clamp(vDir.y, -0.2, 1.0);
        vec3 topo = ${rgb(PALETA.ceuTopo)}, meio = ${rgb(PALETA.ceuMeio)}, hor = ${rgb(PALETA.ceuHorizonte)}, quente = ${rgb(PALETA.brumaQuente)};
        vec3 c = mix(hor, meio, smoothstep(0.0, 0.18, y));
        c = mix(c, topo, smoothstep(0.18, 0.75, y));
        c = mix(c, quente, (1.0 - smoothstep(0.0, 0.08, abs(y - 0.01))) * 0.35); // faixa quente no horizonte
        vec3 q = floor(vDir * 420.0);
        float estrela = step(0.9965, h(q)) * smoothstep(0.25, 0.6, y) * 0.55;
        gl_FragColor = vec4(c + estrela, 1.0);
      }`,
  });
  // o céu está em espaço de exibição (sRGB); sem tone mapping para não lavar o gradiente
  mat.toneMapped = false;
  const ceu = new THREE.Mesh(new THREE.SphereGeometry(raio, 48, 24), mat);
  ceu.renderOrder = -1;
  cena.add(ceu);
  return ceu;
}

// ---------- luz da hora azul ----------
// Céu frio preenche tudo; a luz-chave é sempre uma fonte prática do lugar.
export function luzHoraAzul(cena) {
  const ceu = new THREE.HemisphereLight(0x9cb2e0, 0x2c3140, 1.6);
  cena.add(ceu);
  const contorno = new THREE.DirectionalLight(0x9db4ff, 0.55); // contorno frio vindo do céu
  contorno.position.set(-6, 9, -8);
  cena.add(contorno);
  return { ceu, contorno };
}

// ---------- corte com hachura ----------
// Material de corte: desenha as faces de trás (o "miolo" visto pelo corte) com hachura em espaço de tela,
// como num desenho técnico. Funciona para sólidos convexos (caixas, cilindros) cortados por planos.
function materialHachura(planos, { fundo, linha, angulo = 45, passo = 10, espessura = 1.6, sombrear = false, interseccao }) {
  // Lambert só para ter a normal da face (já invertida por ser BackSide): dá volume ao corte de caixas
  const m = new THREE.MeshLambertMaterial({ side: THREE.BackSide, clippingPlanes: planos, clipIntersection: interseccao });
  const a = (angulo * Math.PI) / 180;
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
      float d = dot(gl_FragCoord.xy, vec2(${Math.cos(a).toFixed(4)}, ${Math.sin(a).toFixed(4)}));
      float f = abs(fract(d / ${passo.toFixed(2)}) - 0.5) * ${passo.toFixed(2)};
      float l = 1.0 - smoothstep(${(espessura / 2).toFixed(2)} - 0.6, ${(espessura / 2).toFixed(2)} + 0.6, f);
      vec3 hach = mix(${rgb(fundo)}, ${rgb(linha)}, l);
      ${sombrear ? 'hach *= mix(0.74, 1.03, 0.5 + 0.5 * dot(normalize(normal), normalize(vec3(0.3, 0.85, 0.45))));' : ''}
      gl_FragColor = vec4(hach, 1.0);`);
  };
  m.customProgramCacheKey = () => `hachura-${fundo}-${linha}-${angulo}-${passo}-${espessura}-${sombrear}`;
  m.toneMapped = false;
  return m;
}

export const HACHURA = {
  estrutura: { fundo: PALETA.hachuraFundo, linha: PALETA.hachuraLinha, angulo: 45, passo: 11, sombrear: true },
  metal: { fundo: PALETA.metalFundo, linha: PALETA.metalLinha, angulo: -45, passo: 6 },
  metal2: { fundo: PALETA.metalFundo, linha: PALETA.metalLinha, angulo: 45, passo: 5 },
};

// Cria um corte em caixa (o volume removido). Comece fechado: corte.abrir(0..1).
// Peças paradas (carcaça, parede) são cortadas e mostram hachura; peças que se movem ficam inteiras.
export function criarCorte({ min, max }) {
  const planos = [new THREE.Plane(), new THREE.Plane(), new THREE.Plane(), new THREE.Plane(), new THREE.Plane(), new THREE.Plane()];
  const centro = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
  const corte = {
    planos,
    // f = 0 fechado, 1 aberto. Abre a partir do centro, nos três eixos.
    abrir(f) {
      const mi = new THREE.Vector3().lerpVectors(centro, min, f);
      const ma = new THREE.Vector3().lerpVectors(centro, max, f);
      // lado negativo de cada plano = dentro da caixa; com clipIntersection só some o que está dentro de todos
      planos[0].set(new THREE.Vector3(-1, 0, 0), mi.x); // x > mi.x
      planos[1].set(new THREE.Vector3(1, 0, 0), -ma.x); // x < ma.x
      planos[2].set(new THREE.Vector3(0, -1, 0), mi.y);
      planos[3].set(new THREE.Vector3(0, 1, 0), -ma.y);
      planos[4].set(new THREE.Vector3(0, 0, -1), mi.z);
      planos[5].set(new THREE.Vector3(0, 0, 1), -ma.z);
    },
    // aplica o corte a um mesh: o mesh perde o volume e ganha a face hachurada
    cortar(mesh, hachura = HACHURA.estrutura) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) { m.clippingPlanes = planos; m.clipIntersection = true; m.clipShadows = true; }
      const miolo = new THREE.Mesh(mesh.geometry, materialHachura(planos, { ...hachura, interseccao: true }));
      miolo.castShadow = false; miolo.receiveShadow = false;
      mesh.add(miolo);
      return mesh;
    },
  };
  corte.abrir(0);
  return corte;
}

// ---------- texto na tela ----------
const CSS = `
@import url('/pacotes/@fontsource/archivo/600.css');
@import url('/pacotes/@fontsource/ibm-plex-mono/500.css');
#camada { position: fixed; inset: 0; width: 1080px; height: 1920px; pointer-events: none; }
#legenda { position: absolute; left: 0; right: 0; top: 1380px; text-align: center; }
#legenda .caixa { display: inline-block; padding: 12px 20px 14px; border-radius: 14px; background: rgba(12,17,34,.62);
  font: 600 50px/1 'Archivo', sans-serif; letter-spacing: -0.01em; color: ${PALETA.creme}; }
#legenda .caixa:empty { display: none; }
#legenda .caixa span { opacity: .72; margin: 0 .14em; }
#legenda .caixa span.acesa { opacity: 1; color: ${PALETA.ambar}; }
#etiquetas { position: absolute; inset: 0; width: 1080px; height: 1920px; overflow: visible; }
#etiquetas line { stroke: ${PALETA.creme}; stroke-width: 1.5; opacity: .85; }
#etiquetas circle { fill: ${PALETA.creme}; }
#etiquetas text { font: 500 22px 'IBM Plex Mono', monospace; letter-spacing: .12em; fill: ${PALETA.creme}; }
#etiquetas rect { fill: rgba(12,17,34,.66); }
#etiquetas line { filter: drop-shadow(0 0 1.5px rgba(12,17,34,.9)); }
#escala { position: absolute; left: 72px; top: 1478px; color: ${PALETA.creme}; padding: 10px 12px 8px;
  border-radius: 8px; background: rgba(12,17,34,.55);
  font: 500 20px 'IBM Plex Mono', monospace; letter-spacing: .1em; }
#escala .barra { height: 9px; border: 1.5px solid ${PALETA.creme}; border-top: none; margin-bottom: 7px; }
`;

export function criarTexto() {
  const estilo = document.createElement('style');
  estilo.textContent = CSS;
  document.head.appendChild(estilo);
  const camada = document.createElement('div');
  camada.id = 'camada';
  camada.innerHTML = `<svg id="etiquetas" viewBox="0 0 1080 1920"></svg><div id="legenda"></div>
    <div id="escala"><div class="barra"></div><div class="rotulo"></div></div>`;
  document.body.appendChild(camada);
  const svg = camada.querySelector('#etiquetas');
  const legendaEl = camada.querySelector('#legenda');
  const escalaEl = camada.querySelector('#escala');

  const naTela = (p, camera) => {
    const v = p.clone().project(camera);
    return { x: (v.x + 1) * 540, y: (1 - v.y) * 960, frente: v.z < 1 };
  };

  return {
    async carregarFontes() {
      await Promise.all([document.fonts.load("600 50px 'Archivo'"), document.fonts.load("500 22px 'IBM Plex Mono'")]);
    },
    // palavras: ['a', 'fechadura'], acesa: índice da palavra falada agora (1 a 3 palavras)
    legenda(palavras = [], acesa = -1) {
      legendaEl.innerHTML = `<span class="caixa">${palavras.map((p, i) => `<span class="${i === acesa ? 'acesa' : ''}">${p}</span>`).join('')}</span>`;
    },
    // etiquetas finas: [{ ponto: Vector3, texto, dx, dy }] — dx/dy = onde fica o texto em relação à peça (px)
    etiquetas(lista, camera) {
      svg.innerHTML = lista.map(({ ponto, texto, dx = 120, dy = -80 }) => {
        const a = naTela(ponto, camera);
        if (!a.frente) return '';
        const bx = a.x + dx, by = a.y + dy;
        const ancora = dx >= 0 ? 'start' : 'end';
        const tx = bx + (dx >= 0 ? 12 : -12);
        const larg = texto.length * 15.84 + 18; // IBM Plex Mono 22px: 13,2 px + 0,12em de espaçamento por letra
        const rx = dx >= 0 ? tx - 10 : tx - larg + 10;
        return `<line x1="${a.x}" y1="${a.y}" x2="${bx}" y2="${by}"/><circle cx="${a.x}" cy="${a.y}" r="4"/>` +
          `<rect x="${rx}" y="${by - 17}" width="${larg}" height="34" rx="6"/>` +
          `<text x="${tx}" y="${by + 7}" text-anchor="${ancora}">${texto}</text>`;
      }).join('');
    },
    // barra de escala honesta: mede na profundidade de `ponto` e escolhe um valor redondo
    escala(ponto, camera) {
      const direita = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).normalize();
      const a = naTela(ponto, camera), b = naTela(ponto.clone().add(direita), camera);
      const pxPorMetro = Math.hypot(b.x - a.x, b.y - a.y);
      const valores = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50];
      let v = valores.find((m) => m * pxPorMetro >= 90) ?? 50;
      const texto = v < 0.01 ? `${Math.round(v * 1000)} mm` : v < 1 ? `${Math.round(v * 100)} cm` : `${v} m`;
      escalaEl.querySelector('.barra').style.width = `${(v * pxPorMetro).toFixed(1)}px`;
      escalaEl.querySelector('.rotulo').textContent = texto;
    },
  };
}

export { cor };
