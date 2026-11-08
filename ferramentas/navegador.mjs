// Abre um projeto no Chromium sem janela, já pronto para seek(t).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { iniciarServidor } from './servidor.mjs';

const require = createRequire(import.meta.url);

function carregarPlaywright() {
  try { return require('playwright'); } catch {}
  // Playwright pré-instalado globalmente no ambiente da nuvem.
  const { execSync } = require('node:child_process');
  const global = execSync('npm root -g').toString().trim();
  return require(path.join(global, 'playwright'));
}

export async function abrirProjeto(pastaProjeto) {
  if (!fs.existsSync(path.join(pastaProjeto, 'index.html'))) {
    throw new Error(`não achei ${path.join(pastaProjeto, 'index.html')}`);
  }
  const { chromium } = carregarPlaywright();
  const servidor = await iniciarServidor(pastaProjeto);
  const navegador = await chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars'],
  });
  const pagina = await navegador.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const erros = [];
  pagina.on('pageerror', (e) => erros.push(e.message));
  pagina.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });

  await pagina.goto(servidor.url, { waitUntil: 'load' });
  try {
    await pagina.waitForFunction(() => typeof window.seek === 'function' && window.ESTUDIO_PRONTO, null, { timeout: 30000 });
    await pagina.evaluate(() => window.ESTUDIO_PRONTO);
  } catch (e) {
    throw new Error(`a página não expôs window.seek a tempo.\n${erros.join('\n') || e.message}`);
  }
  const { duracao, fps } = await pagina.evaluate(() => ({ duracao: window.DURATION, fps: window.FPS || 30 }));
  if (!(duracao > 0)) throw new Error('window.DURATION precisa ser um número > 0');

  return {
    pagina, duracao, fps, erros,
    async quadro(t) {
      await pagina.evaluate((tt) => window.seek(tt), t);
      return pagina.screenshot({ type: 'png', animations: 'disabled', caret: 'hide' });
    },
    async fechar() { await navegador.close(); servidor.fechar(); },
  };
}

// Nunca sobrescreve: nome.mp4 → nome_v2.mp4 → nome_v3.mp4 ...
export function nomeLivre(pasta, base, ext) {
  fs.mkdirSync(pasta, { recursive: true });
  let alvo = path.join(pasta, `${base}${ext}`);
  for (let v = 2; fs.existsSync(alvo); v++) alvo = path.join(pasta, `${base}_v${v}${ext}`);
  return alvo;
}
