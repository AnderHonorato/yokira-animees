// Arquivo: src/lib/visual/posters/gerar-poster.ts
// Poster procedural em SVG. Existe porque nao versionamos arte de terceiros:
// o seed precisa de uma imagem plausivel e o admin troca depois pelo arquivo real.
// Deterministico de proposito — o mesmo slug gera sempre o mesmo poster, entao o cache funciona.
//
// O desenho tem sete camadas: gradiente de base, orbe deslocada, brilho central,
// feixe de luz inclinado, corte diagonal no rodape, vinheta e um grao fininho.
// Cinco delas variam por seed. E arte de preenchimento, entao o custo importa:
// tudo cabe num data URI e nao ha nenhuma imagem de terceiro no repositorio.

const PALETAS: ReadonlyArray<readonly [string, string, string]> = [
  ['#1e0b3d', '#7c3aed', '#f0abfc'],
  ['#0a1229', '#1d4ed8', '#38bdf8'],
  ['#2c0552', '#a21caf', '#fb7185'],
  ['#04220f', '#15803d', '#a3e635'],
  ['#33060a', '#b91c1c', '#fbbf24'],
  ['#080d1c', '#334155', '#94a3b8'],
  ['#111033', '#4338ca', '#c7d2fe'],
  ['#2a0f0a', '#ea580c', '#fde68a'],
  ['#04211f', '#0d9488', '#5eead4']
];

/** Hash estavel e minusculo. Nao precisa ser criptografico, so espalhar bem. */
export function semear(texto: string): number {
  let acumulado = 2166136261;
  for (let i = 0; i < texto.length; i += 1) {
    acumulado ^= texto.charCodeAt(i);
    acumulado = Math.imul(acumulado, 16777619);
  }
  return Math.abs(acumulado);
}

export function paletaDo(slug: string): readonly [string, string, string] {
  return PALETAS[semear(slug) % PALETAS.length];
}

// O nome NAO e desenhado dentro da arte. A interface ja mostra o titulo em cima
// (hero) ou embaixo (card), entao o texto no SVG aparecia duas vezes na mesma peca —
// e, recortado em 16:9, virava uma marca d'agua enorme atravessando a capa.
// O `rotulo` continua no aria-label, que e onde ele serve pra alguma coisa.
export function svgDoPoster(slug: string, rotulo: string, largura = 400, altura = 600): string {
  const [fundo, meio, brilho] = paletaDo(slug);
  const semente = semear(slug);

  // Tudo proporcional ao quadro, e nao em pixels fixos: o mesmo gerador atende
  // poster em pe (2:3) e arte deitada (16:9) sem virar dois desenhos. Os brilhos
  // sao pintados em retangulos de tela cheia, e nao em elipses: elipse com
  // gradiente de raio maior que a propria forma recorta o degrade e deixa um
  // contorno oval visivel no poster — era o que acontecia antes.
  const centroDoBrilho = altura * (0.28 + (semente % 20) / 100);
  const inclinacao = altura * (0.04 + (semente % 9) / 100);

  // Variacoes por seed. Sao poucas e pequenas de proposito: o objetivo e que dois
  // posteres lado a lado nao pareçam o mesmo desenho, nao que cada um seja um
  // quadro diferente. Continua deterministico — mesmo slug, mesmo arquivo.
  const anguloDoFeixe = 12 + ((semente >> 3) % 26);
  const posicaoDoFeixe = 0.12 + ((semente >> 5) % 40) / 100;
  const orbeX = 0.18 + ((semente >> 7) % 64) / 100;
  const orbeY = 0.55 + ((semente >> 11) % 35) / 100;
  const raioDoOrbe = 0.3 + ((semente >> 13) % 22) / 100;
  const larguraDoFeixe = largura * 0.34;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largura} ${altura}" width="${largura}" height="${altura}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${escapar(rotulo)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="${fundo}" />
      <stop offset="58%" stop-color="${meio}" />
      <stop offset="100%" stop-color="${fundo}" />
    </linearGradient>
    <radialGradient id="b" cx="0.5" cy="${(centroDoBrilho / altura).toFixed(3)}" r="0.62">
      <stop offset="0%" stop-color="${brilho}" stop-opacity="0.8" />
      <stop offset="55%" stop-color="${brilho}" stop-opacity="0.22" />
      <stop offset="100%" stop-color="${brilho}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="o" cx="${orbeX.toFixed(3)}" cy="${orbeY.toFixed(3)}" r="${raioDoOrbe.toFixed(3)}">
      <stop offset="0%" stop-color="${brilho}" stop-opacity="0.3" />
      <stop offset="100%" stop-color="${brilho}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="f" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0" />
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.14" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>
    <radialGradient id="v" cx="0.5" cy="0.42" r="0.78">
      <stop offset="55%" stop-color="#000000" stop-opacity="0" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.55" />
    </radialGradient>
    <filter id="n" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
  </defs>
  <rect width="${largura}" height="${altura}" fill="url(#g)" />
  <rect width="${largura}" height="${altura}" fill="url(#o)" />
  <rect width="${largura}" height="${altura}" fill="url(#b)" />
  <rect x="${(largura * posicaoDoFeixe).toFixed(1)}" y="${(-altura).toFixed(1)}" width="${larguraDoFeixe.toFixed(1)}" height="${(altura * 3).toFixed(1)}" fill="url(#f)" transform="rotate(${anguloDoFeixe} ${(largura / 2).toFixed(1)} ${(altura / 2).toFixed(1)})" />
  <path d="M0 ${altura} L${largura} ${(altura - inclinacao).toFixed(1)} L${largura} ${altura} Z" fill="${fundo}" opacity="0.75" />
  <rect width="${largura}" height="${altura}" fill="url(#v)" />
  <rect width="${largura}" height="${altura}" filter="url(#n)" opacity="0.05" />
</svg>`;
}

/** Proporcao deitada, para o hero e para as capas do desktop. */
export function arteLargaEmDataUri(slug: string, rotulo: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgDoPoster(slug, rotulo, 1280, 720))}`;
}

export function posterEmDataUri(slug: string, rotulo: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgDoPoster(slug, rotulo))}`;
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
