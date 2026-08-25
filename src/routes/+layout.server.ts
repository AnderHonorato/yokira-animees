// Arquivo: src/routes/+layout.server.ts
// O usuario da sessao desce pra toda pagina; sem isso cada rota faria a mesma consulta.

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  return { usuario: locals.usuario };
};
