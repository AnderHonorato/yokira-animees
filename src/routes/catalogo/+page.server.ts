// Arquivo: src/routes/catalogo/+page.server.ts

import { listarCatalogoCompleto, listarGeneros } from '$servidor/banco/catalogo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, setHeaders }) => {
  setHeaders({ 'cache-control': 'private, max-age=30' });

  const genero = url.searchParams.get('genero') ?? undefined;
  const [itens, generos] = await Promise.all([listarCatalogoCompleto(genero), listarGeneros()]);
  return { itens, generos, generoAtivo: genero ?? null };
};
