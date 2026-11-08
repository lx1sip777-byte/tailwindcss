// Renderiza um projeto em MP4.
//   node ferramentas/render.mjs projetos/<nome> [--audio narracao.wav] [--crf 18] [--nome saida]
// Vídeo: 1080x1920, 30 fps, H.264 High, yuv420p, BT.709 (faixa limitada), +faststart.
// Áudio (opcional): AAC 48 kHz, normalizado em duas passadas para -14 LUFS / -1 dBTP.
// O áudio nunca é cortado nem acelerado; se a duração não bater com window.DURATION, avisa.
// Saída em projetos/<nome>/saida/; nunca sobrescreve (gera _v2, _v3...).
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { abrirProjeto, nomeLivre } from './navegador.mjs';

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

function medirLoudness(arquivo) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', arquivo,
    '-af', 'loudnorm=I=-14:TP=-1:LRA=11:print_format=json', '-f', 'null', '-']);
  const txt = r.stderr.toString();
  return JSON.parse(txt.slice(txt.lastIndexOf('{'), txt.lastIndexOf('}') + 1));
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
  const m = medirLoudness(audio);
  console.log(`áudio: ${audio} (${m.input_i} LUFS, pico ${m.input_tp} dBTP) → -14 LUFS / -1 dBTP`);
  ffArgs.push('-i', audio);
  filtroAudio = ['-af', `loudnorm=I=-14:TP=-1:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}` +
    `:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`,
    '-ar', '48000', '-c:a', 'aac', '-b:a', '192k'];
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
if (p.erros.length) console.warn('erros na página:\n' + p.erros.join('\n'));
