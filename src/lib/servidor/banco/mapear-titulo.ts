// Arquivo: src/lib/servidor/banco/mapear-titulo.ts
// Traducao Prisma -> formato da interface. Isolado pra ser testavel sem tocar no banco.

import { posterEmDataUri } from '../../visual/posters/gerar-poster.js';
import type { CartaoDeTitulo, DestaqueDoHero } from './tipos-catalogo.js';

export interface TituloBruto {
  id: string;
  slug: string;
  nome: string;
  sinopse: string;
  ano: number;
  classificacao: string;
  novidade: boolean;
  posterUrl: string | null;
  arteHeroUrl: string | null;
  temporadas: { numero: number }[];
  generos: { genero: { nome: string } }[];
  avaliacoes: { nota: number }[];
}

/** Media real das avaliacoes, uma casa decimal. Sem avaliacao devolve null (nao zero). */
export function calcularNota(avaliacoes: { nota: number }[]): number | null {
  if (avaliacoes.length === 0) return null;
  const soma = avaliacoes.reduce((total, item) => total + item.nota, 0);
  return Math.round((soma / avaliacoes.length) * 10) / 10;
}

export function paraCartao(bruto: TituloBruto, assistindoAgora = 0): CartaoDeTitulo {
  const temporadas = bruto.temporadas.length;
  const ultimaTemporada = temporadas > 0 ? Math.max(...bruto.temporadas.map((t) => t.numero)) : 1;

  return {
    id: bruto.id,
    slug: bruto.slug,
    nome: bruto.nome,
    ano: bruto.ano,
    nota: calcularNota(bruto.avaliacoes),
    poster: bruto.posterUrl ?? posterEmDataUri(bruto.slug, bruto.nome),
    classificacao: bruto.classificacao,
    novidade: bruto.novidade,
    temporadas,
    rotuloSecundario: bruto.novidade ? `${ultimaTemporada}ª Temporada` : 'Legendas Br',
    assistindoAgora,
    sinopseCurta: bruto.sinopse.slice(0, 160)
  };
}

export function paraDestaque(bruto: TituloBruto): DestaqueDoHero {
  return {
    id: bruto.id,
    slug: bruto.slug,
    nome: bruto.nome,
    sinopse: bruto.sinopse,
    ano: bruto.ano,
    classificacao: bruto.classificacao,
    generos: bruto.generos.map((ligacao) => ligacao.genero.nome),
    temporadas: bruto.temporadas.length,
    arte: bruto.arteHeroUrl ?? posterEmDataUri(`${bruto.slug}-hero`, bruto.nome),
    novidade: bruto.novidade,
    chamadaGratuita: 'Versão de período de 30 dias gratuito'
  };
}
