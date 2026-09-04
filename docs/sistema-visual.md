# Sistema visual — Yōkira Animes

Tudo que é cor, tamanho ou espaço no projeto sai de `src/lib/estilos/tema.css`.
Se você precisou escrever um valor cru em algum CSS, provavelmente falta um token.

## Paleta

| Token                    | Valor                  | Onde aparece                                      |
| ------------------------ | ---------------------- | ------------------------------------------------- |
| `--cor-fundo`            | `#07070c`              | Fundo da página inteira                           |
| `--cor-fundo-elevado`    | `#101019`              | Painel do hero, diálogos, cartões do painel admin |
| `--cor-superficie`       | `#15151f`              | Cards, campos de formulário, chips neutros        |
| `--cor-superficie-hover` | `#1e1e2b`              | Estado de hover das superfícies                   |
| `--cor-borda`            | `#262633`              | Contorno de painéis e separadores                 |
| `--cor-borda-forte`      | `#34344a`              | Contorno de campo em hover, borda tracejada       |
| `--cor-marca`            | `#8b5cf6`              | Botão principal, aba ativa, badge "Novo episódio" |
| `--cor-marca-forte`      | `#7c3aed`              | Hover do botão principal                          |
| `--cor-marca-secundaria` | `#e879f9`              | Só o fim dos gradientes e brilhos — nunca sozinha |
| `--cor-marca-suave`      | `rgba(139,92,246,.16)` | Chip "Legendas Br", pílula da aba ativa           |
| `--cor-texto`            | `#ffffff`              | Títulos e texto principal                         |
| `--cor-texto-secundario` | `#a5a5b3`              | Sinopse, meta, itens de navegação inativos        |
| `--cor-texto-terciario`  | `#8b8b99`              | Duração de episódio, notas de rodapé              |
| `--cor-estrela`          | `#f5c518`              | Estrela da nota                                   |
| `--cor-coroa`            | `#f0b429`              | Coroa do "30 dias gratuito"                       |

O preto puro saiu: `#07070c` tem um fio de violeta, e é o que impede o roxo da
marca de parecer colado no fundo. Quem muda cor aqui responde ao
`testes/unitarios/contraste-do-tema.teste.ts`, que lê estes valores do CSS e
falha se algum par texto-sobre-superfície cair abaixo de 4.5:1 em qualquer um
dos dois temas.

## Vidro, gradiente e sombra

Três camadas que não existiam e são o que separa o app de um conjunto de
retângulos chapados:

| Token                                                                        | Para quê                                                               |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `--vidro-fundo` / `--vidro-fundo-denso`                                      | Fundo translúcido da barra superior, da barra inferior e dos controles |
| `--vidro-borda` / `--vidro-realce`                                           | Fio de 1px e realce interno dessas superfícies                         |
| `--desfoque-vidro`                                                           | `saturate(160%) blur(18px)` — sempre dentro de `@supports`             |
| `--gradiente-marca` / `--gradiente-marca-forte`                              | Botão primário, selo, indicador da aba ativa                           |
| `--gradiente-superficie`                                                     | Véu que acende o topo de um painel e lhe dá volume                     |
| `--gradiente-borda-marca`                                                    | Contorno em degradê do hero (pseudo-elemento, não `border-image`)      |
| `--brilho-marca`                                                             | Halo radial atrás do hero e das telas sem pôster                       |
| `--sombra-suave` / `--sombra-card` / `--sombra-flutuante` / `--sombra-marca` | Quatro degraus de elevação                                             |

Regra fixa: **desfoque nunca é a única camada**. Onde há `backdrop-filter`
existe antes um fundo opaco o bastante para o texto continuar legível sem ele.

## Tipografia

Duas famílias auto-hospedadas em `static/fontes/`, declaradas em
`tipografia.css` e carregadas no `app.html`:

| Papel     | Família                         | Token            | Por quê                                                                           |
| --------- | ------------------------------- | ---------------- | --------------------------------------------------------------------------------- |
| Display   | **Outfit** (300–900)            | `--fonte-titulo` | Geométrica e larga — o desenho de chamada das plataformas de streaming            |
| Interface | **Plus Jakarta Sans** (300–800) | `--fonte-base`   | Aberturas maiores que a Inter entre 11 e 14px, que é onde vive quase todo o texto |

A Inter continua no repositório e no fim do `font-family`: é a última rede de
segurança e só baixa se as duas primeiras falharem. Ambas são variáveis, um
arquivo por subset (latin e latin-ext — o `Ō` da logo vive no ext).

`base.css` liga a Outfit em todo `h1`–`h6`; o resto herda a Jakarta do `body`.

### Escala

| Token        | rem    | px  | Uso                                          |
| ------------ | ------ | --- | -------------------------------------------- |
| `--texto-10` | 0.625  | 10  | Selo dentro da arte, rótulo em tela estreita |
| `--texto-11` | 0.6875 | 11  | Chips, meta dos cards, subtítulo da logo     |
| `--texto-12` | 0.75   | 12  | Rótulos da barra inferior, legendas          |
| `--texto-13` | 0.8125 | 13  | Título de card, navegação, botões            |
| `--texto-14` | 0.875  | 14  | Corpo, nome de episódio                      |
| `--texto-15` | 0.9375 | 15  | Corpo em coluna larga (sinopse do "Sobre")   |
| `--texto-16` | 1      | 16  | Campo de formulário no mobile                |
| `--texto-18` | 1.125  | 18  | Título de seção no mobile                    |
| `--texto-20` | 1.25   | 20  | Título do episódio na tela de assistir       |
| `--texto-24` | 1.5    | 24  | Título de seção e de página no mobile        |
| `--texto-28` | 1.75   | 28  | Título do hero abaixo de 400px               |
| `--texto-32` | 2      | 32  | Título do hero no mobile, título de página   |
| `--texto-40` | 2.5    | 40  | Título do hero no desktop                    |
| `--texto-48` | 3      | 48  | Título do hero acima de 1440px               |

A escala cresceu no topo, e só no topo: chip, meta e rótulo continuam nos
mesmos 11–13px. O que mudou foi a **hierarquia** — antes um título de seção era
um negrito de 20px que não se distinguia de qualquer outro texto forte da
página; hoje ele é display, com entressilha fechada e um traço da marca antes.

Campo de formulário tem 16px no mobile por regra de plataforma, não por gosto:
abaixo disso o Android e o iOS dão zoom sozinhos ao focar.

### Ajuste de desenho

`--entressilha-display` (-0.02em), `--entressilha-titulo` (-0.01em) e
`--entressilha-rotulo` (0.08em); `--altura-linha-apertada` (1.05),
`--altura-linha-titulo` (1.15) e `--altura-linha-corpo` (1.55). A Outfit é
larga: em caixa alta ela pede entressilha negativa, senão o título do hero
estoura a coluna.

**Exceção documentada:** abaixo de 400 px o título do hero cai para
`--texto-28`. Nota, ano e duração usam `tabular-nums` — sem isso a coluna de
tempo do player "dança" a cada segundo.

## Ritmo, raios e sombras

Espaçamentos em múltiplos de 4: `--espaco-1` (4px) até `--espaco-12` (48px).
Raios: `--raio-chip` 8px · `--raio-card` 14px · `--raio-painel` 20px ·
`--raio-painel-grande` 26px · `--raio-botao` 999px.
Duas durações de transição (`160ms` e `280ms`), ambas com a mesma curva
`cubic-bezier(0.22, 1, 0.36, 1)`.

## Medidas de layout

| Token                     | Valor  | Por quê                                      |
| ------------------------- | ------ | -------------------------------------------- |
| `--alvo-toque`            | 44px   | Mínimo de área tocável exigido no mobile     |
| `--altura-barra-inferior` | 66px   | Altura da barra de 5 abas, fora da safe area |
| `--largura-maxima`        | 1600px | Onde o conteúdo para de crescer no desktop   |

A barra inferior soma `env(safe-area-inset-bottom)` por fora desses 66px, e o
cabeçalho soma `env(safe-area-inset-top)` — em aparelho com recorte a barra
encostava no gesto do sistema.

### Sangria no mobile

Hero da página de título e vídeo da página de assistir **cancelam** o respiro
lateral da casca (`margin-inline: calc(var(--espaco-4) * -1)`) em vez de
esticar. Cancelar é o que mantém 360px sem rolagem horizontal. Se o padding
lateral da casca mudar, os dois precisam mudar junto.

## Como CSS e marcação convivem

Cada componente é um par (às vezes trio) de arquivos com o mesmo nome:

```
cabecalho.svelte   marcação
cabecalho.css      estilo, importado pelo <script> do componente
cabecalho.ts       lógica, quando existe
```

O CSS entra por `import './arquivo.css'` dentro do `<script>` — e **não** por um
bloco `<style>`. Consequência prática: as regras são globais, então **toda classe
leva o prefixo do componente** (`.cartao-`, `.hero-`, `.painel-`, `.marca-`).
Foi uma escolha consciente: o `<style>` do Svelte escopa automaticamente, mas
obriga o CSS a morar dentro do `.svelte`, o que o prompt proíbe.

`:global(...)` **não funciona** nestes arquivos — é sintaxe exclusiva do bloco
`<style>` do Svelte e o minificador rejeita. Em CSS global basta o seletor
descendente normal (`.cartao-nota svg`).

## Ícones

29 ícones em `src/lib/visual/icones/`, um arquivo por ícone. Regras fixas:
`viewBox="0 0 24 24"`, `stroke-width="1.75"`, terminais arredondados,
`stroke="currentColor"` para herdar a cor do contexto, `aria-hidden="true"`.

Sólidos (`fill="currentColor"`): `play`, `pausa`, `coroa`.
Com opção de preenchimento: `estrela`, `marcador-lista`, `polegar-cima`.
Todos os outros são de contorno.

Nenhuma biblioteca de ícones e nenhum emoji — há um teste ponta a ponta que
falha se aparecer qualquer caractere das faixas de emoji do Unicode.

## Pôsteres

O repositório não versiona arte de terceiros. `src/lib/visual/posters/gerar-poster.ts`
gera um SVG determinístico a partir do slug: mesma entrada, mesma imagem — o que
mantém o cache válido. O administrador substitui pelo arquivo real via painel.

São sete camadas: gradiente de base, orbe deslocada, brilho central, feixe de luz
inclinado, corte diagonal no rodapé, vinheta e um grão fino. Cinco delas variam
por seed, para dois pôsteres lado a lado não parecerem o mesmo desenho. Os
brilhos são pintados em retângulos de tela cheia, e não em elipses: elipse com
degradê de raio maior que a própria forma recorta o degradê e deixa um contorno
oval visível — era o que acontecia antes.
