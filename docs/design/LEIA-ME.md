# Canvas de design

Maquetes das telas principais do Yōkira Animes, publicadas como um canvas
navegável em que dá pra clicar em qualquer elemento e ajustar na mão.

**Link:** https://claude.ai/code/artifact/56178f08-db6c-4537-8e37-0e98d789fd17

## O que tem aqui

Cada `.dc.html` é um artboard, e `canvas.json` diz onde cada um fica no canvas.

| Arquivo                | Tela                                    | Quadro    |
| ---------------------- | --------------------------------------- | --------- |
| `Main.dc.html`         | Início, com hero rotativo e duas trilhas | 1440×1340 |
| `Catalogo.dc.html`     | Catálogo em grade, com filtros de gênero | 1440×1010 |
| `Titulo.dc.html`       | Detalhe do título, episódios e painel    | 1440×1220 |
| `InicioMobile.dc.html` | Início no celular, com a barra de 5 abas | 390×844   |
| `Player.dc.html`       | Assistir, com os controles do player     | 1440×860  |
| `MinhaLista.dc.html`   | Minha Lista                              | 1440×730  |
| `Admin.dc.html`        | Painel administrativo e fila de HLS      | 1440×750  |
| `BaseVisual.dc.html`   | Tokens, tipografia, botões e os ícones   | 1200×1960 |

O canvas tem duas páginas: **Telas** e **Base visual**.

## De onde vieram os valores

Nada foi desenhado de memória. Cores, escala de texto, espaçamentos, raios e os
alvos de toque de 44px saem de `src/lib/estilos/tema.css`; a anatomia de cada
peça sai dos componentes em `src/lib/componentes/`; os 29 ícones são os SVG de
`src/lib/visual/icones/`; e as capas são o gerador procedural de
`src/lib/visual/posters/gerar-poster.ts` rodando nos mesmos slugs do seed, com o
mesmo recorte que o CSS faz (`object-fit: cover; object-position: center 42%`).

Os tokens aparecem literais nos `style=` de cada elemento — é isso que deixa o
painel de propriedades editar cor e medida direto no canvas. A lista de tokens
está repetida como `:root` no topo de cada arquivo, só como referência de leitura.

## O que ainda não tem artboard

São maquetes estáticas: nada clica, rola ou toca vídeo. Faltam os estados que
dependem de interação — hover do card expandido, diálogo de dupla confirmação,
faixa de offline, tela de primeiro acesso, esqueletos de carregamento e o tema
claro (`tema-claro.css`).

As notas de avaliação e os números do painel são valores de exemplo: no app eles
vêm do banco.

## Como atualizar

Edite os `.dc.html` (ou `canvas.json`) e peça pro Claude regerar e republicar no
mesmo link. O arquivo publicado tem ~2,6 MB porque carrega o editor junto, então
ele fica fora do versionamento — veja `.gitignore`.
