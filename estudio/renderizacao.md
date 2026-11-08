# Por que o render demora

## Quanto demorou

| Render | Tempo | Por quê |
|---|---|---|
| v1 (enguia) | 37,8 min | primeira versão |
| v2, v3 | ~1 min cada | só o áudio foi refeito (vídeo reaproveitado) |
| v4 | 39,7 min | corrigir etiquetas na borda e o volume |
| v5 | 38,5 min | corrigir as células apagadas (C5–C7) e uma etiqueta no C6 |

**Total: ~2 h de render**, das quais ~78 min (v4 e v5) foram para corrigir defeitos que eu deixei passar.
Esse foi o maior desperdício: os defeitos só apareceram no vídeo pronto, e cada correção custou um render inteiro.

## Por que cada render leva ~38 min (medido)

1.886 quadros × ~1,2 s por quadro. Medindo cada quadro em 12 cenas (média de 6 quadros por cena):

| Etapa | Tempo por quadro | Parte |
|---|---|---|
| JavaScript da cena (pose da enguia, órgãos, legenda) | 14 ms | 1% |
| **Desenho 3D** | **844 ms** | **86%** |
| Captura da tela em PNG | 125 ms | 13% |

O gargalo é o desenho 3D. A máquina da nuvem **não tem placa de vídeo**: o Chromium desenha o WebGL com o
SwiftShader, que imita uma GPU usando a CPU (4 núcleos). Uma GPU de verdade faria o mesmo quadro em poucos
milissegundos. Em cima disso, cada quadro é pesado para uma CPU:

- 1080 × 1920 pixels com antisserrilhado (várias amostras por pixel);
- sombras (o mapa de sombra é desenhado a cada quadro);
- nos planos da linha d'água a cena é desenhada **duas vezes** (acima e abaixo d'água);
- os quadros são feitos um de cada vez, num só navegador.

## O que dá para fazer (ainda não aplicado)

| Mudança | Ganho esperado | Muda a imagem? |
|---|---|---|
| Conferir tudo **antes** do render (agora existe `ferramentas/checar.mjs`) e revisar a prévia percorrendo as cenas em sequência, como o render faz | evita renders repetidos (o que mais custou) | não |
| Em ajustes, **renderizar só o trecho** pedido e emendar no vídeo | um ajuste de 5 s leva ~3 min em vez de ~38 | não (é o que o `CLAUDE.md` pede: "mexa só no trecho") |
| Renderizar com **2 a 4 navegadores em paralelo**, cada um com um pedaço do vídeo | até ~2× (a medir: o SwiftShader já usa vários núcleos) | não |
| Rodar numa máquina **com GPU** (o seu computador, pelo Remote Control) | de ~38 min para poucos minutos | não |
| Menos antisserrilhado ou sombras mais leves | algum ganho | sim, um pouco |

As duas primeiras não têm custo nenhum na imagem; posso implementar quando você quiser.
