// Tira quadros parados de um projeto.
//   node ferramentas/still.mjs projetos/<nome> 0 1.5 4.2     → um PNG por instante (em segundos)
//   node ferramentas/still.mjs projetos/<nome> --n 6          → 6 instantes espalhados pela duração
// Saída em projetos/<nome>/saida/stills/ (nunca sobrescreve).
import path from 'node:path';
import { abrirProjeto, nomeLivre } from './navegador.mjs';
import fs from 'node:fs';

const args = process.argv.slice(2);
const projeto = args[0];
if (!projeto) { console.error('uso: node ferramentas/still.mjs projetos/<nome> [t1 t2 ...] [--n 6]'); process.exit(1); }
const iN = args.indexOf('--n');
let tempos = args.slice(1).filter((a, i, l) => !a.startsWith('--') && l[i - 1] !== '--n').map(Number);

const p = await abrirProjeto(projeto);
if (iN >= 0) { const n = Number(args[iN + 1]); tempos = Array.from({ length: n }, (_, i) => (p.duracao * i) / n); }
if (!tempos.length) tempos = [0];

const pasta = path.join(projeto, 'saida', 'stills');
for (const t of tempos) {
  const q = Math.round(t * p.fps); // encaixa no quadro exato do vídeo
  const arquivo = nomeLivre(pasta, `${path.basename(path.resolve(projeto))}_q${String(q).padStart(4, '0')}_${(q / p.fps).toFixed(2)}s`, '.png');
  fs.writeFileSync(arquivo, await p.quadro(q / p.fps));
  console.log(arquivo);
}
await p.fechar();
if (p.erros.length) console.warn('erros na página:\n' + p.erros.join('\n'));
