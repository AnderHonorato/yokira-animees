// Arquivo: src/routes/configuracoes/+page.server.ts

import { fail, redirect } from '@sveltejs/kit';
import { banco } from '$servidor/banco/cliente';
import { enviarVerificacaoDeEmail } from '$servidor/email/fluxos-de-conta';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.usuario) throw redirect(303, '/entrar');

  const [sessoesAtivas, conta] = await Promise.all([
    banco.sessao.count({
      where: { usuarioId: locals.usuario.id, revogadaEm: null, expiraEm: { gt: new Date() } }
    }),
    banco.usuario.findUnique({
      where: { id: locals.usuario.id },
      select: { emailVerificado: true, email: true }
    })
  ]);

  return {
    sessoesAtivas,
    email: conta?.email ?? locals.usuario.email,
    emailVerificado: conta?.emailVerificado ?? false
  };
};

export const actions: Actions = {
  reenviarVerificacao: async ({ locals, url }) => {
    if (!locals.usuario) throw redirect(303, '/entrar');

    const enviado = await enviarVerificacaoDeEmail(url.origin, locals.usuario);
    if (!enviado) {
      return fail(502, { mensagemVerificacao: 'Não foi possível enviar agora. Tente mais tarde.' });
    }

    return { mensagemVerificacao: 'Link de confirmação enviado para o seu e-mail.' };
  }
};
