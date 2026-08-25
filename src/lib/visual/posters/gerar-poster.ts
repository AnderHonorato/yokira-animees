// Arquivo: src/lib/visual/posters/gerar-poster.ts
// Poster procedural em SVG. Existe porque nao versionamos arte de terceiros:
// o seed precisa de uma imagem plausivel e o admin troca depois pelo arquivo real.
// Deterministico de proposito — o mesmo slug gera sempre o mesmo poster, entao o cache funciona.

const PALETAS: ReadonlyArray<readonly [string, string, string]> = [
  ['#2b1055', '#7c3aed', '#f0abfc'],
  ['#0f172a', '#1d4ed8', '#38bdf8'],
  ['#3b0764', '#a21caf', '#fb7185'],
  ['#052e16', '#15803d', '#a3e635'],
  ['#450a0a', '#b91c1c', '#fbbf24'],
  ['#0c1222', '#334155', '#94a3b8']
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

export function svgDoPoster(slug: string, rotulo: string, largura = 400, altura = 600): string {
  const [fundo, meio, brilho] = paletaDo(slug);
  const semente = semear(slug);
  const anguloDaFaixa = 12 + (semente % 26);
  const alturaDoArco = 200 + (semente % 160);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largura} ${altura}" width="${largura}" height="${altura}" role="img" aria-label="${escapar(rotulo)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="${fundo}" />
      <stop offset="58%" stop-color="${meio}" />
      <stop offset="100%" stop-color="${fundo}" />
    </linearGradient>
    <radialGradient id="b" cx="0.5" cy="0.34" r="0.62">
      <stop offset="0%" stop-color="${brilho}" stop-opacity="0.85" />
      <stop offset="100%" stop-color="${brilho}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${largura}" height="${altura}" fill="url(#g)" />
  <circle cx="${largura / 2}" cy="${alturaDoArco}" r="${largura * 0.42}" fill="url(#b)" />
  <path d="M0 ${altura} L${largura} ${altura - anguloDaFaixa * 6} L${largura} ${altura} Z" fill="${fundo}" opacity="0.75" />
  <text x="${largura / 2}" y="${altura - 46}" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="30" font-weight="800" fill="#ffffff" opacity="0.94">${escapar(rotulo.slice(0, 16))}</text>
</svg>`;
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
