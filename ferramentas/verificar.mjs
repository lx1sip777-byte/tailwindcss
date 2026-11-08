// Confere se o estúdio está pronto: Node, Python, ffmpeg (libx264, aac, loudnorm), Three.js e WebGL no Chromium.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
let falhou = false;
const ok = (msg) => console.log('  ok   ' + msg);
const ruim = (msg, dica) => { falhou = true; console.log('  FALHA ' + msg + (dica ? `\n        → ${dica}` : '')); };
const rodar = (cmd, a) => { const r = spawnSync(cmd, a); return r.error ? null : (r.stdout.toString() + r.stderr.toString()); };

const [maior] = process.versions.node.split('.').map(Number);
maior >= 18 ? ok(`Node ${process.version}`) : ruim(`Node ${process.version} (precisa ≥ 18)`, 'instale Node 20+');

const py = rodar('python3', ['--version']);
py ? ok(py.trim()) : ruim('Python 3 não encontrado', 'apt-get install -y python3');

const ff = rodar('ffmpeg', ['-hide_banner', '-version']);
if (!ff) ruim('ffmpeg não encontrado', 'apt-get install -y ffmpeg');
else {
  ok(ff.split('\n')[0]);
  const enc = rodar('ffmpeg', ['-hide_banner', '-encoders']);
  const fil = rodar('ffmpeg', ['-hide_banner', '-filters']);
  /libx264/.test(enc) ? ok('encoder libx264') : ruim('ffmpeg sem libx264', 'instale um ffmpeg com GPL/libx264');
  /\baac\b/.test(enc) ? ok('encoder aac') : ruim('ffmpeg sem aac');
  /loudnorm/.test(fil) ? ok('filtro loudnorm') : ruim('ffmpeg sem loudnorm');
}

fs.existsSync(path.join(AQUI, 'node_modules/three/build/three.module.js'))
  ? ok('Three.js ' + JSON.parse(fs.readFileSync(path.join(AQUI, 'node_modules/three/package.json'))).version)
  : ruim('Three.js não instalado', 'cd ferramentas && npm install');

try {
  const { abrirProjeto } = await import('./navegador.mjs');
  void abrirProjeto;
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  let pw; try { pw = require('playwright'); } catch { pw = require(path.join(rodar('npm', ['root', '-g']).trim(), 'playwright')); }
  const b = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage();
  const gl = await pg.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); if (!g) return null; const d = g.getExtension('WEBGL_debug_renderer_info'); return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'WebGL2'; });
  await b.close();
  gl ? ok('Chromium sem janela com WebGL2: ' + gl) : ruim('Chromium sem WebGL2');
} catch (e) {
  ruim('Chromium/Playwright: ' + e.message.split('\n')[0], 'npm i -D playwright && npx playwright install chromium');
}

console.log(falhou ? '\nFaltam itens acima.' : '\nEstúdio pronto.');
process.exit(falhou ? 1 : 0);
