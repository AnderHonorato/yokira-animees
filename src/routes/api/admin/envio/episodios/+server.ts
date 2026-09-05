// Arquivo: src/routes/api/admin/envio/episodios/+server.ts
// Cria um episodio vazio por arquivo solto na temporada e devolve os ids.
//
// Existe pra separar as duas coisas que antes viajavam juntas: o CADASTRO, que e
// rapido e precisa ficar de pe mesmo se a rede cair, e o VIDEO, que e lento e sobe
// depois pela fila. Assim uma queda no meio do envio deixa os episodios criados, e
// nao um lote pela metade sem registro nenhum.

import { error, json } from '@sveltejs/kit';
import { banco } from '$servidor/banco/cliente';
import { criarEpisodiosParaArquivos } from '$servidor/lote-de-episodios';
import { registrarAcaoAdministrativa } from '$servidor/autenticacao/confirmacao';
import { exigirPapel } from '$servidor/permissoes/papeis';
import type { RequestHandler } from './$types';

const MAXIMO_POR_VEZ = 100;

export const POST: RequestHandler = async ({ request, locals }) => {
  exigirPapel(locals.usuario?.papel, 'EDITOR');

  const corpo = (await request.json()) as { temporadaId?: unknown; nomes?: unknown };
  const temporadaId = typeof corpo.temporadaId === 'string' ? corpo.temporadaId : '';
  const nomes = Array.isArray(corpo.nomes)
    ? corpo.nomes
        .filter((nome): nome is string => typeof nome === 'string')
        .slice(0, MAXIMO_POR_VEZ)
    : [];

  if (!temporadaId || nomes.length === 0) throw error(400, 'Faltou a temporada ou os arquivos.');

  const temporada = await banco.temporada.findUnique({
    where: { id: temporadaId },
    select: { id: true }
  });
  if (!temporada) throw error(404, 'Temporada não encontrada.');

  const criados = await criarEpisodiosParaArquivos(temporadaId, nomes);
  await registrarAcaoAdministrativa(
    locals.usuario!.id,
    'criar-episodios-em-lote',
    temporadaId,
    String(criados.length)
  );

  return json({ episodios: criados });
};
