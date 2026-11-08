// Efeitos sonoros pontuais, gerados aqui mesmo (ffmpeg aevalsrc): nada contínuo, só eventos.
// Cada evento: { t: segundos, tipo, vol (0..1, opcional) }.
import { spawnSync } from 'node:child_process';

// expressões de síntese (mono). random(0) = ruído branco.
export const TIPOS = {
  clique: { d: 0.05, e: '(random(0)*2-1)*exp(-t*260)', f: 'highpass=f=1400' },          // corte abre/fecha
  tic: { d: 0.06, e: 'sin(2*PI*2600*t)*exp(-t*85)', f: '' },                              // régua: etiqueta aparece
  bipe: { d: 0.13, e: 'sin(2*PI*1480*t)*min(1,t*200)*min(1,(0.13-t)*80)', f: '' },        // visor para no valor
  estalo: { d: 0.03, e: '(random(0)*2-1)*exp(-t*420)', f: 'highpass=f=2500' },            // célula acende
  pulso: { d: 0.3, e: 'sin(2*PI*110*t)*exp(-t*16)+0.35*(random(0)*2-1)*exp(-t*45)', f: 'lowpass=f=3000' },
  zap: { d: 0.38, e: '(random(0)*2-1)*exp(-t*8)*(0.55+0.45*sin(2*PI*55*t))', f: 'bandpass=f=2200:width_type=o:w=2' },
  tranco: { d: 0.22, e: 'sin(2*PI*62*t)*exp(-t*22)+0.2*(random(0)*2-1)*exp(-t*90)', f: 'lowpass=f=900' },
  cliqueBaixo: { d: 0.06, e: 'sin(2*PI*820*t)*exp(-t*110)', f: '' },                     // pulsos fracos
};

// gera uma trilha mono 48 kHz com a duração exata do vídeo
export function gerarTrilhaSons(eventos, duracao, destino, ganho = 0.16) {
  if (!eventos.length) return null;
  const args = ['-hide_banner', '-loglevel', 'error', '-y'];
  const filtros = [];
  eventos.forEach((ev, i) => {
    const tp = TIPOS[ev.tipo];
    if (!tp) throw new Error(`tipo de som desconhecido: ${ev.tipo}`);
    args.push('-f', 'lavfi', '-i', `aevalsrc='${tp.e}':s=48000:d=${tp.d}`);
    const ms = Math.max(0, Math.round(ev.t * 1000));
    filtros.push(`[${i}:a]${tp.f ? tp.f + ',' : ''}volume=${((ev.vol ?? 1) * ganho).toFixed(3)},adelay=${ms}:all=1[s${i}]`);
  });
  const juntar = eventos.map((_, i) => `[s${i}]`).join('');
  filtros.push(`${juntar}amix=inputs=${eventos.length}:normalize=0:duration=longest,apad=whole_dur=${duracao.toFixed(3)},atrim=0:${duracao.toFixed(3)}[saida]`);
  args.push('-filter_complex', filtros.join(';'), '-map', '[saida]', '-ac', '1', '-ar', '48000', destino);
  const r = spawnSync('ffmpeg', args);
  if (r.status !== 0) throw new Error('ffmpeg (sons): ' + r.stderr.toString());
  return destino;
}
