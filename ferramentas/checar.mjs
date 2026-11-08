// node ferramentas/checar.mjs projetos/<nome> [de] [até] [passo]
// Confere, quadro a quadro, se etiquetas saem da margem ou encavalam entre si, com a legenda ou com a barra de escala
import { abrirProjeto } from './navegador.mjs';
const [, , projeto, de = '0', ate = '9999', passo = '3'] = process.argv;
const p = await abrirProjeto(projeto);
const ruins = {};
const q0 = Math.ceil(Number(de) * 30), q1 = Math.min(Math.round(p.duracao * 30) - 1, Math.floor(Number(ate) * 30));
for (let q = q0; q <= q1; q += Number(passo)) {
  await p.pagina.evaluate((t) => window.seek(t), q / 30);
  const r = await p.pagina.evaluate(() => {
    const cx = (e) => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; };
    const etq = [...document.querySelectorAll('#etiquetas rect')].map(cx);
    const outros = [];
    const leg = document.querySelector('#legenda .caixa'); if (leg && leg.offsetParent && leg.textContent) outros.push(cx(leg));
    const esc = document.querySelector('#escala'); if (esc) outros.push(cx(esc));
    const cruza = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
    const fora = etq.some(([x0, y0, x1, y1]) => x0 < 16 || x1 > 1064 || y0 < 16 || y1 > 1904);
    let sobre = false;
    for (let i = 0; i < etq.length; i++) { for (let j = i + 1; j < etq.length; j++) if (cruza(etq[i], etq[j])) sobre = true; for (const o of outros) if (cruza(etq[i], o)) sobre = true; }
    return { fora, sobre };
  });
  for (const k of ['fora', 'sobre']) if (r[k]) (ruins[k] = ruins[k] || []).push((q / 30).toFixed(1));
}
await p.fechar();
console.log(Object.keys(ruins).length ? JSON.stringify(Object.fromEntries(Object.entries(ruins).map(([k, v]) => [k, `${v.length} quadros: ${v.slice(0, 12).join(', ')}`]))) : 'ok: nenhuma etiqueta fora da margem ou encavalada');
