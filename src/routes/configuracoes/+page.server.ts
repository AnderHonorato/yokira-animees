// Arquivo: src/routes/configuracoes/+page.server.ts

import { redirect } from '@sveltejs/kit';
import { banco } from '$servidor/banco/cliente';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.usuario) throw redirect(303, '/entrar');

  const sessoesAtivas = await banco.sessao.count({
    where: { usuarioId: locals.usuario.id, revogadaEm: null, expiraEm: { gt: new Date() } }
  });

  return { sessoesAtivas };
};
