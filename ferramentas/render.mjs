// Renderiza um projeto em MP4.
//   node ferramentas/render.mjs projetos/<nome> [--audio narracao.wav] [--crf 18] [--nome saida]
// Vídeo: 1080x1920, 30 fps, H.264 High, yuv420p, BT.709 (faixa limitada), +faststart.
// Áudio (opcional): AAC 48 kHz estéreo, -14 LUFS / -1 dBTP (ganho + limitador de pico real, conferido no fim).
// Efeitos: se a página expõe window.SONS ([{ t, tipo, vol }]), gera os efeitos (sons.mjs) e mistura por
// baixo da narração; a narração entra inteira, sem cortes, pausas ou mudança de velocidade.
// O áudio nunca é cortado nem acelerado; se a duração não bater com window.DURATION, avisa.
// Saída em projetos/<nome>/saida/; nunca sobrescreve (gera _v2, _v3...).
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { abrirProjeto, nomeLivre } from './navegador.mjs';
import { gerarTrilhaSons } from './sons.mjs';

const args = process.argv.slice(2);
const opcao = (n, padrao) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : padrao; };
const projeto = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!projeto) { console.error('uso: node ferramentas/render.mjs projetos/<nome> [--audio arquivo] [--crf 18]'); process.exit(1); }

const nome = opcao('nome', path.basename(path.resolve(projeto)));
const crf = opcao('crf', '18');
let audio = opcao('audio');
if (!audio) {
  const auto = fs.readdirSync(projeto).find((f) => /^narracao\.(wav|mp3|m4a|flac|aac)$/i.test(f));
  if (auto) audio = path.join(projeto, auto);
}

function duracaoAudio(arquivo) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', arquivo]);
  return Number(r.stdout.toString().trim());
}

// -14 LUFS / -1 dBTP: ganho até o alvo + limitador de pico real (sobreamostrado 4×), ajustando o ganho
// em passadas até acertar o integrado, já em estéreo (limita só o necessário). Só volume: nada é cortado, pausado ou acelerado.
function medirR128(arquivo) {
  const txt = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', arquivo, '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr.toString();
  const res = txt.slice(txt.lastIndexOf('Summary'));
  return { I: Number(res.match(/I:\s+(-?[\d.]+) LUFS/)[1]), TP: Number(res.match(/Peak:\s+(-?[\d.]+) dBFS/)[1]) };
}
function normalizar(entrada, pasta) {
  const lim = path.join(pasta, 'normalizado.wav'), teste = path.join(pasta, 'teste.m4a');
  let ganho = -14 - medirR128(entrada).I, m;
  for (let i = 0; i < 8; i++) {
    const a = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', entrada, '-af',
      `aformat=channel_layouts=stereo,volume=${ganho.toFixed(2)}dB,aresample=192000,alimiter=limit=0.82:attack=2:release=60:level=false,aresample=48000`, '-c:a', 'pcm_s24le', lim]);
    if (a.status !== 0) throw new Error('normalizar: ' + a.stderr.toString());
    spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', lim, '-ac', '2', '-c:a', 'aac', '-b:a', '192k', teste]); // mede no formato entregue (estéreo)
    m = medirR128(teste);
    console.log(`  volume: ganho ${ganho.toFixed(2)} dB → ${m.I} LUFS, pico ${m.TP} dBTP`);
    if (Math.abs(m.I + 14) <= 0.05 && m.TP <= -1) break;
    ganho += -14 - m.I;
  }
  return lim;
}


const t0 = Date.now();
const p = await abrirProjeto(projeto);
const total = Math.round(p.duracao * p.fps);
console.log(`${nome}: ${p.duracao}s × ${p.fps} fps = ${total} quadros`);

const ffArgs = ['-hide_banner', '-loglevel', 'error', '-y',
  '-f', 'image2pipe', '-framerate', String(p.fps), '-c:v', 'png', '-i', '-'];
let filtroAudio = [];
if (audio) {
  const da = duracaoAudio(audio);
  if (Math.abs(da - p.duracao) > 1 / p.fps) {
    console.warn(`AVISO: áudio tem ${da.toFixed(3)}s e o vídeo ${p.duracao}s. Ajuste window.DURATION (o áudio não é cortado).`);
  }
  const sons = await p.pagina.evaluate(() => window.SONS || []);
  if (sons.length) {
    const tmp = path.join(projeto, 'saida', '.tmp'); fs.mkdirSync(tmp, { recursive: true });
    const trilha = gerarTrilhaSons(sons, da, path.join(tmp, 'sons.wav'));
    const mix = path.join(tmp, 'mix.wav');
    const rm = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', audio, '-i', trilha, '-filter_complex',
      '[0:a]aresample=48000,aformat=channel_layouts=mono[n];[n][1:a]amix=inputs=2:normalize=0:duration=first[m]', '-map', '[m]', '-c:a', 'pcm_s24le', mix]);
    if (rm.status !== 0) throw new Error('mistura: ' + rm.stderr.toString());
    console.log(`efeitos: ${sons.length} eventos misturados por baixo da narração`);
    audio = mix;
  }
  const tmpA = path.join(projeto, 'saida', '.tmp'); fs.mkdirSync(tmpA, { recursive: true });
  const m0 = medirR128(audio);
  console.log(`áudio: ${audio} (${m0.I} LUFS, pico ${m0.TP} dBTP) → -14 LUFS / -1 dBTP`);
  audio = normalizar(audio, tmpA);
  ffArgs.push('-i', audio);
  filtroAudio = ['-ar', '48000', '-ac', '2', '-c:a', 'aac', '-b:a', '192k'];
}

const saida = nomeLivre(path.join(projeto, 'saida'), nome, '.mp4');
ffArgs.push(
  '-map', '0:v', ...(audio ? ['-map', '1:a'] : []),
  '-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-profile:v', 'high', '-pix_fmt', 'yuv420p',
  '-r', String(p.fps),
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
  ...filtroAudio,
  '-movflags', '+faststart', saida,
);

const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
const fim = new Promise((ok, falha) => ff.on('close', (c) => (c === 0 ? ok() : falha(new Error(`ffmpeg saiu com código ${c}`)))));

let marco = 0;
for (let i = 0; i < total; i++) {
  const png = await p.quadro(i / p.fps);
  if (!ff.stdin.write(png)) await new Promise((ok) => ff.stdin.once('drain', ok));
  const pct = Math.floor(((i + 1) / total) * 10) * 10;
  if (pct > marco) { marco = pct; process.stdout.write(`  ${pct}%`); }
}
ff.stdin.end();
await fim;
await p.fechar();
console.log(`\npronto: ${saida} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
if (audio) {
  const fim = medirR128(saida);
  console.log(`volume final: ${fim.I} LUFS integrado, pico real ${fim.TP} dBTP`);
}
if (p.erros.length) console.warn('erros na página:\n' + p.erros.join('\n'));
