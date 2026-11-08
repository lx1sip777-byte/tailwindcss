# A pasta do estúdio

Tudo o que você me passou e tudo o que foi entregue, num lugar só.
Num chat novo, peça **"abre a pasta do estúdio"**: eu leio este arquivo e continuo de onde paramos.

> **Importante para um chat novo:** esta pasta e o `CLAUDE.md` estão na branch `claude/studio-rules-ri6igt`.
> Um chat novo começa na branch `main`. Para eu achar a pasta, escolha essa branch ao abrir a sessão
> ou junte a branch na `main` (posso abrir o pull request quando você pedir).

## O que tem aqui

| Arquivo / pasta | O que é |
|---|---|
| [`pedidos.md`](pedidos.md) | Cada pedido seu, com o texto exato, em ordem, e o que foi feito |
| [`referencias/`](referencias/) | Os 13 prints de perfis que você gosta + [`analise.md`](referencias/analise.md) (o que têm em comum) |
| [`entregues/`](entregues/) | O que foi entregue: vídeo final da enguia, folha de prévia, 3 stills do estilo, cubo de teste |
| [`renderizacao.md`](renderizacao.md) | Por que o render demora (medido) e o que dá para fazer |
| [`../CLAUDE.md`](../CLAUDE.md) | Suas regras + o estilo "Corte na hora azul" + regras aprendidas. Fica na raiz do repositório porque só lá ele é lido sozinho em todo chat |

O que você me passou e onde está:

| Você passou | Onde está |
|---|---|
| Regras do estúdio (texto do CLAUDE.md) | `../CLAUDE.md` (texto original em `pedidos.md`, pedido 1) |
| 13 prints de referência | `referencias/01…13_*.jpg` |
| Narração da enguia (`certo.mp3`) | `../projetos/enguia-eletrica/narracao.mp3` (cópia idêntica, byte a byte) |
| Aprovações e decisões | "Decisões" abaixo |

## Estado atual

- **Estilo:** "Corte na hora azul", ficha de 8 linhas no `CLAUDE.md`, código em `../ferramentas/motor/estilo.js`.
- **Vídeo pronto:** enguia elétrica, `entregues/enguia-eletrica/enguia-eletrica_v5.mp4`
  (62,85 s, 1080×1920, 30 fps, H.264 BT.709, AAC 48 kHz, -14,0 LUFS, pico -1,2 dBTP, loop).
- **Nada pendente.** Próximo passo: uma nova narração, ou ajustes em alguma cena da enguia (geram `_v6`).

## Decisões que você tomou

1. Regras do estúdio valem para todos os vídeos (pedido 1).
2. Estilo próprio "Corte na hora azul" aprovado e anotado no `CLAUDE.md` (pedidos 3 e 4).
3. Folha de prévia da enguia aprovada: "ok, pode renderizar" (pedido 6).
4. Volume: opção 1, cumprir o `CLAUDE.md` à risca (-14 LUFS com limitador de pico; a narração não é cortada,
   pausada nem acelerada, só o volume muda). Eu recomendei e você aprovou junto com a prévia.

## Como o estúdio funciona (resumo)

```
ferramentas/            motor e comandos (detalhes em ferramentas/README.md)
  motor/estudio.js      cada vídeo é um index.html com window.DURATION e window.seek(t)
  motor/estilo.js       o estilo em código: céu, corte com hachura, legenda, etiquetas, barra de escala
  motor/narracao.js     tempo de cada palavra → legenda de 1 a 3 palavras
  transcrever.py        narração → tempo de cada palavra (Whisper), ajustado pelas pausas reais
  folha.mjs             folha de prévia (um still por cena)
  checar.mjs            confere quadro a quadro se alguma etiqueta sai da margem ou encavala
  render.mjs            MP4 final: quadros + efeitos + volume -14 LUFS
  sons.mjs              efeitos pontuais gerados por síntese
projetos/
  teste/                cubo girando (teste do motor)
  estilo/               teste do estilo (fechadura)
  enguia-eletrica/      o vídeo da enguia (narração, transcrição, cenas)
```

Fluxo para uma narração nova: transcrever → montar cenas → `folha.mjs` → **você aprova** → `checar.mjs` → `render.mjs`.

O ambiente de nuvem "tailwindcss (estúdio de vídeo)" já libera o Hugging Face (modelos do Whisper) e tem um script
que instala tudo ao abrir uma sessão nova nele. Os vídeos de trabalho (`projetos/*/saida/`) ficam fora do git e se
perdem quando a máquina é trocada; por isso as entregas finais estão copiadas em `entregues/`.
