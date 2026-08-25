// Arquivo: src/routes/api/avaliacao/+server.ts

import { json, error } from '@sveltejs/kit';
import { avaliarTitulo } from '$servidor/banco/avaliacao';
import { validarAvaliacao } from '$lib/validacoes/lista';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.usuario) throw error(401, 'Precisa entrar na conta.');

  const dados = validarAvaliacao(await request.json());
  return json(await avaliarTitulo(locals.usuario.id, dados.tituloId, dados.nota));
};
