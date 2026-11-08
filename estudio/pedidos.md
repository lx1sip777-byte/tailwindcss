# Seus pedidos, em ordem

Texto exato de cada pedido, seguido do que foi feito.

---

## 1. Regras do estúdio

> Guarde o texto abaixo como CLAUDE.md. São as regras do meu estúdio:
> siga todas em todos os vídeos.
>
> (texto original abaixo)

```
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

## Meu estilo (preencha no Passo 3)
- Fundo:
- Paleta:
- Luz:
- Material do "por dentro":
- Câmera:
- Texto na tela:
- Som:
- Assinatura:

## Regras que aprendi (vá acrescentando)
-
```

**Feito:** salvo como `CLAUDE.md` na raiz do repositório. Ele foi crescendo depois: estilo (pedido 4) e regras aprendidas.

---

## 2. Montar o estúdio

> Monte um estúdio de vídeos 3D verticais (1080x1920, 30 fps) aqui.
> 1. Prepare Node.js, Python e ffmpeg. Se algo falhar, explique e resolva.
> 2. Crie ferramentas/ com um motor de render: cada vídeo é um index.html
>    com Three.js que expõe window.DURATION e window.seek(t) (desenha o
>    quadro exato do instante t, sem timers); um script em Node abre a
>    página num navegador sem janela, captura quadro a quadro e gera o
>    MP4 com ffmpeg (H.264, yuv420p, BT.709); e um comando de stills.
> 3. Faça projetos/teste: um cubo girando 5 s em fundo azul-noite.
> 4. Me mostre um still e me entregue o MP4.

**Feito:** Node 22, Python 3.13 e ffmpeg 6.1 já estavam prontos (nada falhou). Motor em `ferramentas/`,
cubo em `projetos/teste/`. Entrega: `entregues/teste/cubo-teste.mp4`.

---

## 3. Criar um estilo próprio a partir de referências

> Estes são prints de perfis que eu gosto. Analise o que têm em comum
> (fundo, luz, cores, material, câmera, texto na tela) e crie um estilo
> PRÓPRIO para mim, sem copiar nenhum. Siga o CLAUDE.md. Me entregue a
> ficha de estilo em 8 linhas (fundo, paleta, luz, material, câmera,
> texto, som, assinatura) e 3 stills de teste. Não renderize vídeo.
>
> (13 prints anexados: estão em `referencias/`)

**Feito:** análise em `referencias/analise.md`; estilo "Corte na hora azul"; 3 stills em `entregues/estilo/`.

---

## 4. Anotar o estilo

> Anote este estilo no CLAUD
> E.md e me entregue o arquivo
> atualizado."

**Feito:** seção "Meu estilo" do `CLAUDE.md` preenchida; arquivo entregue.

---

## 5. Narração da enguia

> Aqui está a narração pronta. Não mexa no áudio: a animação segue a
> fala, à risca. Transcreva com o tempo de cada palavra, monte as cenas
> seguindo o CLAUDE.md e me mostre a folha de prévia. Não renderize
> o vídeo completo antes do meu ok.
>
> (anexo: `certo.mp3`, agora em `projetos/enguia-eletrica/narracao.mp3`)

Texto falado (62,85 s):

> Como um peixe consegue produzir eletricidade dentro do próprio corpo? A enguia elétrica parece comum, mas
> esconde um sistema elétrico impressionante. Na espécie Electrophorus voltai, pesquisadores registraram até
> 860 volts. O segredo está em três órgãos elétricos que percorrem boa parte do corpo. Dentro deles, existem
> milhares de células musculares modificadas, chamadas eletrócitos. Cada célula produz uma pequena diferença
> elétrica. Sozinha, ela é fraca, mas as células ficam organizadas como pilhas em sequência. Então, sinais do
> sistema nervoso ativam muitas delas quase ao mesmo tempo. A soma dessas tensões gera uma descarga e cria um
> campo elétrico na água. Se outro animal estiver perto o suficiente, a descarga pode interferir nos seus
> músculos e nervos. Mas a enguia não usa eletricidade apenas para atacar. Impulsos mais fracos ajudam a
> explorar o ambiente e perceber o que está por perto. Como um peixe consegue produzir eletricidade dentro do
> próprio corpo?

**Feito:** transcrição palavra a palavra (`projetos/enguia-eletrica/transcricao.txt`), 13 cenas, folha de prévia
(`entregues/enguia-eletrica/folha-de-previa.png`). Para baixar o Whisper foi criado o ambiente
"tailwindcss (estúdio de vídeo)" com acesso ao Hugging Face.

---

## 6. Aprovação

> ok, pode redenrizat

**Feito:** vídeo final `entregues/enguia-eletrica/enguia-eletrica_v5.mp4`. As versões anteriores ficaram
guardadas (nada sobrescrito): a v1 saiu com o volume 0,2 dB abaixo; v2/v3 corrigiram o volume; a v4 tinha
as células apagadas nas cenas 5–7 e etiquetas na borda; a v5 é a certa.

---

## 7. Velocidade e esta pasta

> achei que vc demorou mt na renderização do vídeo, descubra o porquê. logo depois quero que vc una todas
> as informações que passei pra vc em uma pasta. Pra depois que eu abrir um novo chat e pedir a pasta pra
> vc, vc abrir a pasta lá.

**Feito:** diagnóstico em `renderizacao.md`; esta pasta; o `CLAUDE.md` agora diz para abrir esta pasta
quando você pedir.
