# Auditoria visual — Yōkira Animes

Comparação lado a lado entre as três telas de referência e o que o app renderiza.
Capturas em `docs/capturas/`, geradas por `docs/capturar-telas.mjs` a partir do
**build de produção**.

Larguras auditadas: 360, 390, 414, 768, 1024, 1280, 1440 e 1920 px.

> **Redesenho de 2026.** A tabela abaixo continua valendo como inventário do que
> a referência pedia e onde cada peça mora. O que mudou foi o **acabamento**, não
> a estrutura: tipografia nova (Outfit + Plus Jakarta Sans), camada de vidro nas
> barras, gradientes de marca, raios maiores e hero sangrado no celular. As
> divergências deliberadas estão listadas em "Onde saímos da referência de
> propósito", no fim.

## Tabela de fidelidade

| Elemento da referência                                            | Onde foi implementado                            | Situação                             |
| ----------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------ |
| Logo `YŌKIRA` com `IRA` roxo + `A N I M E E S` espaçado           | `visual/marca/logo-yokira.svelte`                | Igual                                |
| Lupa e avatar circular à direita (mobile)                         | `casca/cabecalho.svelte`                         | Igual                                |
| `PT ⌄` + botão roxo "Assinar e Logar" (desktop)                   | `casca/cabecalho.svelte`                         | Igual                                |
| Navegação `Início · Catálogo · Novidades · Gêneros · Minha Lista` | `casca/navegacao-principal.svelte`               | Igual                                |
| Item ativo branco com sublinhado roxo de 2 px                     | `navegacao-principal.css`                        | Igual                                |
| Painel do hero com borda e raio de 14 px                          | `home/banner-destaque-estilo.css`                | Igual                                |
| Badge roxo "Novo episódio" no canto da arte                       | `banner-destaque.svelte`                         | Igual                                |
| Título do hero em caixa alta                                      | `banner-destaque.svelte`                         | Igual (28 px mobile / 40 px desktop) |
| Coroa dourada + "Versão de período de 30 dias gratuito"           | `banner-destaque.svelte` + `icones/coroa.svelte` | Igual                                |
| Selo `16` roxo · ano · `4 Temporadas` · gêneros                   | `banner-destaque.svelte` + `comum/chip.svelte`   | Igual                                |
| Sinopse limitada a 3 linhas                                       | `-webkit-line-clamp: 3`                          | Igual                                |
| "Assistir agora" · "+ Minha Lista" · botão circular de curtir     | `comum/botao-pill.svelte`                        | Igual                                |
| 5 dots com o ativo alongado em roxo                               | `banner-destaque-estilo.css`                     | Igual                                |
| Trilha com título à esquerda e "Ver mais ›" à direita             | `home/trilha-conteudo.svelte`                    | Igual                                |
| Card com pôster 2:3 e raio de 10 px                               | `visual/molduras/moldura-card.svelte`            | Igual                                |
| Meta do card: ano · ★ nota · chip `Legendas Br`                   | `home/cartao-conteudo.svelte`                    | Igual                                |
| Em Novidades a meta vira só `Nª Temporada`                        | `cartao-conteudo.svelte`                         | Igual                                |
| Badge "Novo episódio" nos cards de Novidades                      | `cartao-conteudo.svelte`                         | Igual                                |
| Barra inferior de 5 abas com ativo em roxo                        | `casca/barra-inferior.svelte`                    | Igual                                |
| Abas `Episódios · Sobre · Personagens · Recomendações`            | `detalhes/abas-conteudo.svelte`                  | Igual                                |
| `Temporada N ⌄` à esquerda e `Ordenar ⌄` à direita                | `detalhes/lista-episodios.svelte`                | Igual                                |
| Episódio: miniatura, `1. Nome`, `23min`, chips, download          | `detalhes/item-episodio.svelte`                  | Igual                                |
| Primeiro episódio destacado com fundo                             | `item-episodio.css`                              | Igual                                |
| Coluna direita: `Trailers ›` com card e duração                   | `detalhes/painel-trailers.svelte`                | Igual                                |
| `Mais episódios ›` compacto                                       | `painel-trailers.svelte`                         | Igual                                |
| Botão largo "Ver todos os episódios"                              | `painel-trailers.svelte`                         | Igual                                |

## Divergências encontradas e corrigidas

Na primeira rodada de capturas, sete pontos não batiam. Todos foram corrigidos.

| Problema                                                             | Causa                                                | Correção                                                      |
| -------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------- |
| Chip `Legendas Br` vazava por cima do card vizinho                   | linha meta sem `min-width: 0` nem `overflow`         | `overflow: hidden` + `white-space: nowrap` em `.cartao-meta`  |
| "Minha Lista" e "Configurações" colidiam na barra inferior em 360 px | rótulo em 12 px para 5 abas                          | 10 px abaixo de 420 px, com reticências e `min-width: 0`      |
| Hero desktop com arte de 400 px e vazio enorme ao lado do texto      | coluna de arte de 300 px                             | 240 px (home) e 230 px (detalhes) + `align-items: start`      |
| `CREPÚSCULO` estourava a borda em 360 px, depois quebrava no meio    | título em 28 px numa coluna estreita                 | 1,375 rem + `hyphens: auto` + arte de 100 px abaixo de 400 px |
| Badge "Novo episódio" quebrando em duas linhas                       | arte estreita sem `nowrap`                           | `white-space: nowrap` e fonte de 10 px em telas estreitas     |
| Todas as notas apareciam como `9.0` ou `10.0`                        | seed com um voto por título derivado da popularidade | 5 votantes com variação por hash de `slug:posição`            |
| `1 Temporadas` na página de detalhes                                 | plural fixo no template                              | ternário singular/plural                                      |

Nenhuma divergência conhecida permanece aberta.

## Onde saímos da referência de propósito

O redesenho manteve a estrutura da referência e mudou o acabamento. Estes pontos
divergem da tela original, e cada um tem um motivo:

| Ponto                                  | Referência               | Hoje                                                | Por quê                                                                                               |
| -------------------------------------- | ------------------------ | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Hero no celular                        | Arte 16:9 acima do texto | Arte 4:3 ao FUNDO, texto por cima                   | Duas caixas empilhadas liam como dois cartões; com o véu terminando na cor da página vira uma peça só |
| Recuo do texto do hero                 | —                        | 36% da largura                                      | Com 44% o hero acabava em 621px num Pixel 5 e a primeira fileira de capas ficava fora da tela         |
| Hero da página de título               | Cartão dentro da página  | Sangra até as bordas no celular                     | Mesmo motivo; acima de 1024px ele volta a ser painel                                                  |
| Título de seção                        | Negrito de 16/20px       | Display de 18/24px com traço da marca               | Em 20px sem acento ele não se distinguia de qualquer outro texto forte da página                      |
| Barra inferior                         | Ativo em roxo            | Ativo em roxo DENTRO de uma pílula                  | Alvo de 44px continua igual; a pílula é o que diz onde você está sem depender só da cor               |
| Chip dentro do card                    | —                        | Entressilha fechada e 2px a menos de padding        | Com o padding cheio "Legendas Br" media 152px numa caixa de 138 e o "r" ficava cortado                |
| Setas do carrossel                     | Disco opaco              | Disco de vidro + desvanecimento na borda            | O disco opaco brigava com a capa; o fade diz que há mais conteúdo fora da tela                        |
| Controles do player                    | Nativos do navegador     | Barra de vidro própria, alvo de 44px                | Já era assim antes deste redesenho; aqui só ganharam o mesmo idioma visual do resto                   |
| Próximos episódios na tela de assistir | Não existia              | Seção nova ao fim da página                         | A página terminava em beco sem saída: acabou o episódio, ou volta pro título ou fecha o app           |
| Estado vazio da grade                  | Não existia              | Painel tracejado com brilho da marca                | Busca sem resultado deixava a página parecendo quebrada                                               |
| Painel administrativo                  | Não existia              | Cabeçalho, abas roláveis e tabela-cartão no celular | Era um formulário HTML cru dentro de um app desenhado, e não dava para operar no celular              |

## Verificações automatizadas

Estas regras não dependem de olhar captura — falham no CI:

| Regra                                        | Teste                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------ |
| Sem rolagem horizontal em 360 px             | `home.teste.ts` — compara `scrollWidth` com `clientWidth`                      |
| Nenhum emoji na interface                    | `home.teste.ts` — varre o `body` contra as faixas de emoji do Unicode          |
| Alvo de toque ≥ 44 px na barra inferior      | `navegacao.teste.ts` — mede `boundingBox()`                                    |
| Barra inferior só no mobile                  | `navegacao.teste.ts` — visível em 390, oculta em 1440                          |
| Setas do carrossel só no desktop, e no hover | `carrossel-e-cache.teste.ts`                                                   |
| Card expande no hover apenas no desktop      | `carrossel-e-cache.teste.ts`                                                   |
| A faixa da seta não engole o toque do card   | `carrossel-e-cache.teste.ts` — rola a trilha pra dentro da tela antes de medir |
| Contraste AA nos dois temas                  | `contraste-do-tema.teste.ts` — lê os hex direto do CSS                         |
| Dots trocam o destaque do hero               | `home.teste.ts`                                                                |

## Nota sobre o conteúdo das capturas

Os títulos e as artes das capturas são **fictícios e nossos**. As três imagens de
referência serviram apenas de guia de layout: nenhum título, arte ou texto de
terceiros entrou no repositório. Os pôsteres são gradientes SVG gerados por
`gerar-poster.ts` a partir do slug.
