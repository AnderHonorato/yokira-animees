// Arquivo: src/routes/api/admin/envio/+server.ts
// Envio de video: UM arquivo por requisicao, em fluxo, e o estado de quem ja foi.
//
// O envio morava numa action de formulario: o navegador prendia a aba na requisicao,
// nao havia barra de progresso (so o girador do proprio navegador) e o lote de doze
// episodios era um POST unico — se caisse no decimo, perdiam-se os dez que ja tinham
// subido. Aqui cada arquivo e uma requisicao propria, entao o cliente sabe a
// porcentagem de cada uma, pode reenviar so a que falhou e continua usando a tela.

import { error, json } from '@sveltejs/kit';
import { banco } from '$servidor/banco/cliente';
import { gravarFluxo } from '$servidor/armazenamento/gravar-fluxo';
import { processarArquivo } from '$servidor/processamento/transcodificar';
import { situacaoDaFila } from '$servidor/processamento/fila';
import { registrarAcaoAdministrativa } from '$servidor/autenticacao/confirmacao';
import { exigirPapel } from '$servidor/permissoes/papeis';
import { estadoDosEpisodios } from '$servidor/banco/estado-de-envio';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, url, locals }) => {
  exigirPapel(locals.usuario?.papel, 'EDITOR');

  const episodioId = url.searchParams.get('episodio') ?? '';
  const nome = url.searchParams.get('nome') ?? '';
  if (!episodioId || !nome) throw error(400, 'Faltou o episódio ou o nome do arquivo.');
  if (!request.body) throw error(400, 'Requisição sem corpo.');

  const episodio = await banco.episodio.findUnique({
    where: { id: episodioId },
    select: { id: true }
  });
  if (!episodio) throw error(404, 'Episódio não encontrado.');

  let registro;
  try {
    registro = await gravarFluxo(episodioId, nome, request.body);
  } catch (erro) {
    throw error(400, erro instanceof Error ? erro.message : 'Falha ao gravar o arquivo.');
  }

  await registrarAcaoAdministrativa(locals.usuario!.id, 'enviar-video', episodioId, nome);

  // Sem await: converter tres variantes leva minutos e a resposta do envio nao pode
  // esperar por isso. Quem acompanha o resto pergunta pelo GET aqui embaixo.
  void processarArquivo(registro.id);

  return json({ arquivoId: registro.id, fila: situacaoDaFila() });
};

/**
 * Estado de conversao dos episodios pedidos. Uma chamada com varios ids em vez de
 * uma por episodio: a tela do titulo acompanha a temporada inteira.
 */
export const GET: RequestHandler = async ({ url, locals }) => {
  exigirPapel(locals.usuario?.papel, 'EDITOR');

  const ids = (url.searchParams.get('episodios') ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id !== '')
    .slice(0, 200);

  if (ids.length === 0) return json({ episodios: {}, fila: situacaoDaFila() });

  return json({ episodios: await estadoDosEpisodios(ids), fila: situacaoDaFila() });
};
