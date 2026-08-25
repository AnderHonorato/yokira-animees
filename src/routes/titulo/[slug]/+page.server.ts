// Arquivo: src/routes/titulo/[slug]/+page.server.ts

import { error } from '@sveltejs/kit';
import { detalharTitulo, proximosEpisodios, recomendacoesPara } from '$servidor/banco/titulo';
import { idsNaLista } from '$servidor/banco/lista';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const detalhe = await detalharTitulo(params.slug);
  if (!detalhe) throw error(404, 'Título não encontrado.');

  const [recomendacoes, maisEpisodios, lista] = await Promise.all([
    recomendacoesPara(params.slug),
    proximosEpisodios(params.slug),
    locals.usuario ? idsNaLista(locals.usuario.id) : Promise.resolve([])
  ]);

  return {
    ...detalhe,
    recomendacoes,
    maisEpisodios,
    naLista: lista.includes(detalhe.destaque.id)
  };
};
