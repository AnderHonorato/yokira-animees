// Arquivo: src/routes/+page.server.ts
// Home montada no servidor: o HTML ja chega pintado, sem esperar JavaScript.

import { montarCatalogoPublico } from '$servidor/banco/catalogo';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ setHeaders }) => {
  const catalogo = await montarCatalogoPublico();

  // 30s de cache privado. E o que faz voltar pra home ja visitada pintar do cache do
  // navegador em vez de bater no banco de novo. `private` porque a resposta acompanha
  // a sessao do layout; 30s porque catalogo nao muda de minuto em minuto.
  setHeaders({ 'cache-control': 'private, max-age=30' });

  return { catalogo };
};
