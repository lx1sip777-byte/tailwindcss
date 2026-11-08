// Folha de prévia: um still por cena, com tempo, fala, imagem, etiquetas e som.
//   node ferramentas/folha.mjs projetos/<nome>
// Lê window.CENAS da página. Gera projetos/<nome>/saida/previa/folha.png (nunca sobrescreve) e os stills.
import fs from 'node:fs';
import path from 'node:path';
import { abrirProjeto, nomeLivre } from './navegador.mjs';

const projeto = process.argv[2];
if (!projeto) { console.error('uso: node ferramentas/folha.mjs projetos/<nome>'); process.exit(1); }
const nome = path.basename(path.resolve(projeto));
const pasta = path.join(projeto, 'saida', 'previa');
fs.mkdirSync(pasta, { recursive: true });

const p = await abrirProjeto(projeto);
const cenas = await p.pagina.evaluate(() => window.CENAS);
if (!cenas?.length) throw new Error('a página não expôs window.CENAS');

const fmt = (s) => s.toFixed(2).replace('.', ',');
const cartoes = [];
for (const c of cenas) {
  const t = c.still ?? (c.ini + c.fim) / 2;
  const q = Math.round(t * p.fps);
  const png = await p.quadro(q / p.fps);
  const arq = nomeLivre(pasta, `${c.id}_q${String(q).padStart(4, '0')}`, '.png');
  fs.writeFileSync(arq, png);
  cartoes.push({ ...c, t: q / p.fps, img: png.toString('base64') });
  console.log(arq);
}
const erros = [...p.erros];
const dur = p.duracao;

// monta a folha numa página e captura
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@import url('/pacotes/@fontsource/archivo/600.css'); @import url('/pacotes/@fontsource/ibm-plex-mono/500.css');
body { margin: 0; background: #10152a; color: #f3ede0; font: 15px/1.4 'Archivo', sans-serif; width: 1380px; }
header { padding: 28px 32px 10px; } h1 { margin: 0; font-size: 30px; } .sub { font: 500 14px 'IBM Plex Mono', monospace; opacity: .75; margin-top: 6px; }
.grade { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; padding: 18px 32px 32px; }
.c { background: #182040; border-radius: 12px; overflow: hidden; }
.c img { width: 100%; display: block; aspect-ratio: 9/16; }
.c .tx { padding: 10px 12px 14px; }
.id { font: 500 13px 'IBM Plex Mono', monospace; color: #ffb547; letter-spacing: .06em; }
.fala { margin: 6px 0 8px; font-size: 15px; } .fala::before { content: '“'; } .fala::after { content: '”'; }
.k { font: 500 11px 'IBM Plex Mono', monospace; letter-spacing: .08em; opacity: .6; text-transform: uppercase; margin-top: 6px; }
.v { font-size: 13px; opacity: .92; }
</style></head><body><header><h1>Folha de prévia — ${esc(nome)}</h1>
<div class="sub">${cartoes.length} cenas · ${fmt(dur)} s · 1080×1920 · 30 fps · tempo = início da palavra na narração (áudio intacto)</div></header>
<div class="grade">${cartoes.map((c) => `<div class="c"><img src="data:image/png;base64,${c.img}">
<div class="tx"><div class="id">${esc(c.id)} · ${fmt(c.ini)}–${fmt(c.fim)} s · still ${fmt(c.t)} s</div>
<div class="fala">${esc(c.fala)}</div>
<div class="k">imagem</div><div class="v">${esc(c.imagem)}</div>
${c.etiquetas ? `<div class="k">etiquetas</div><div class="v">${esc(c.etiquetas)}</div>` : ''}
${c.som ? `<div class="k">som</div><div class="v">${esc(c.som)}</div>` : ''}</div></div>`).join('')}</div></body></html>`;
fs.writeFileSync(path.join(pasta, 'folha.html'), html);
await p.pagina.setViewportSize({ width: 1380, height: 1000 });
await p.pagina.goto(new URL('saida/previa/folha.html', p.pagina.url()).href);
await p.pagina.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode())); });
const destino = nomeLivre(pasta, 'folha', '.png');
await p.pagina.screenshot({ path: destino, fullPage: true });
await p.fechar();
console.log('folha: ' + destino);
if (erros.length) console.warn('erros na página:\n' + erros.join('\n'));
