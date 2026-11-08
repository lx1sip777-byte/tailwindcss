// Narração → tempo de cada palavra e legenda de 1 a 3 palavras com a palavra falada acesa.
// Lê o transcricao.json gerado por ferramentas/transcrever.py. O áudio nunca é tocado aqui.

const limpar = (p) => p.replace(/[.,;:!"“”]+$/g, '').replace(/^["“”]+/, '');
const normal = (p) => limpar(p).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[?]/g, '');

export async function carregarNarracao(url = 'transcricao.json') {
  const d = await (await fetch(url)).json();
  return criarNarracao(d);
}

export function criarNarracao(d) {
  const P = d.palavras;

  // blocos de legenda: até 3 palavras, até ~18 letras, quebra na pontuação
  const blocos = [];
  let atual = [];
  P.forEach((w, i) => {
    const txt = atual.map((j) => limpar(P[j].p)).join(' ');
    if (atual.length && (atual.length === 3 || txt.length + 1 + limpar(w.p).length > 18)) { blocos.push(atual); atual = []; }
    atual.push(i);
    if (/[.,;:?!]$/.test(w.p)) { blocos.push(atual); atual = []; }
  });
  if (atual.length) blocos.push(atual);

  return {
    duracao: d.duracao,
    palavras: P,
    frases: d.frases,
    blocos,
    // instante em que começa a n-ésima ocorrência (0, 1, ...) de uma palavra
    w(texto, n = 0, campo = 'ini') {
      const alvo = normal(texto);
      let k = -1;
      for (const p of P) if (normal(p.p) === alvo && ++k === n) return p[campo];
      throw new Error(`palavra não encontrada na narração: "${texto}" (#${n})`);
    },
    // legenda no instante t: { palavras: [...], acesa: índice }
    legenda(t) {
      let b = -1;
      for (let i = 0; i < blocos.length; i++) if (P[blocos[i][0]].ini <= t) b = i; else break;
      if (b < 0) return { palavras: [], acesa: -1 };
      const bloco = blocos[b];
      const ultima = P[bloco[bloco.length - 1]];
      const proximo = blocos[b + 1] ? P[blocos[b + 1][0]].ini : Infinity;
      // em pausa longa (troca de frase), a legenda sai logo depois da última palavra
      if (t > ultima.fim + 0.35 && proximo - ultima.fim > 0.45) return { palavras: [], acesa: -1 };
      let acesa = 0;
      bloco.forEach((j, k) => { if (P[j].ini <= t) acesa = k; });
      return { palavras: bloco.map((j) => limpar(P[j].p)), acesa };
    },
  };
}
