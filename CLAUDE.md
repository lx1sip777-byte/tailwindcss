# Meu estúdio

## Como trabalhar comigo
- Nunca edite o áudio da narração (sem cortes, pausas ou aceleração).
  A animação segue a fala, à risca.
- Quando eu anexar uma narração: transcreva com o tempo de cada
  palavra, monte as cenas e me mostre a folha de prévia sozinho.
- Só renderize o vídeo completo depois que eu aprovar a prévia.
- Em ajustes, mexa só no trecho pedido.
- Nunca escreva por cima de um vídeo pronto: use _v2, _v3.

## Formato
- Vertical 1080x1920, 30 fps, H.264, BT.709, AAC 48 kHz.
- Volume -14 LUFS, pico máximo -1 dBTP.
- O fim emenda no começo (loop): últimos 2 s com o plano inicial.

## Estética (regras gerais)
- Objeto no lugar onde existe de verdade, cenário rico. Nada minimalista.
- Mostre o mecanismo por dentro (corte, transparência ou abertura).
- Brilho contido: só a peça citada brilha; nada estourado.
- Escala coerente. Câmera só com motivo.
- Sem personagem parado tapando o quadro.

## Texto na tela
- Topo limpo. Legenda pequena embaixo, 1 a 3 palavras, palavra
  falada acesa. Etiquetas finas sem encavalar.
- Cada coisa falada ganha uma imagem.

## Som
- Só efeitos pontuais nos eventos. Nada contínuo.

## Meu estilo: "Corte na hora azul" (código em ferramentas/motor/estilo.js)
- Fundo: o lugar real na hora azul. Céu índigo→azul com faixa quente no horizonte e cenário completo (casa, rua, plantas, fiação). Nunca fundo vazio.
- Paleta: azuis da hora azul + neutros quentes dessaturados; latão e aço no mecanismo; âmbar #FFB547 só na peça citada; creme #F3EDE0 no texto e na hachura.
- Luz: o céu frio preenche; a luz-chave é sempre uma fonte prática do lugar (arandela, poste, janela), quente e suave; dentro do corte, luz de bancada neutra, sem sombra dura; nada estourado.
- Material do "por dentro": corte em caixa. O que é parado (parede, carcaça) é cortado e mostra hachura creme de desenho técnico; o que se move (pinos, molas, chave) fica inteiro, em latão/aço.
- Câmera: lente normal, altura de gente. Três distâncias: plano do lugar → 3/4 do corte → perpendicular ao corte. Só aproxima quando a fala entra no mecanismo; no fim volta ao plano inicial.
- Texto na tela: topo limpo. Legenda Archivo 600 50 px numa caixinha escura embaixo, palavra falada em âmbar. Etiquetas IBM Plex Mono 22 px, caixa alta, fio de 1,5 px, com medida real ("PINO · Ø 3 mm").
- Som: só eventos. Clique seco quando o corte abre, "tic" de régua a cada etiqueta, toque metálico curto quando a peça se move. Nada contínuo.
- Assinatura: barra de escala real no canto inferior esquerdo em todo plano + hachura creme em todo corte; no loop o corte se fecha e volta ao plano do lugar.

## Regras que aprendi (vá acrescentando)
- Tempo das palavras: o Whisper adianta o começo das frases; sempre ajustar pelas pausas reais do áudio.
- Bicho comprido em quadro vertical some: usar pose em curva/diagonal (ex.: enguia em "J" subindo para respirar).
- Debaixo d'água, o que está na superfície vira silhueta preta vista de baixo: tirar do quadro.
- Antes do render, conferir em todos os quadros (não só nos stills) que nenhuma etiqueta sai da margem ou encavala.
- Volume: medir no arquivo entregue (AAC estéreo) e limitar já em estéreo, só o necessário.
