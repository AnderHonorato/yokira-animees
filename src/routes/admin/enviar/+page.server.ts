// Arquivo: src/routes/admin/enviar/+page.server.ts
// Recebe o arquivo, grava fora de static/ e dispara o ffmpeg sem segurar a resposta.

import { fail } from '@sveltejs/kit';
import { banco } from '$servidor/banco/cliente';
import { gravarUpload } from '$servidor/armazenamento/gravar-upload';
import { processarArquivo } from '$servidor/processamento/transcodificar';
import { registrarAcaoAdministrativa } from '$servidor/autenticacao/confirmacao';
import { exigirPapel } from '$servidor/permissoes/papeis';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const episodios = await banco.episodio.findMany({
    take: 60,
    orderBy: [{ temporada: { titulo: { nome: 'asc' } } }, { numero: 'asc' }],
    include: { temporada: { include: { titulo: { select: { nome: true } } } } }
  });

  return {
    episodios: episodios.map((episodio) => ({
      id: episodio.id,
      rotulo: `${episodio.temporada.titulo.nome} — T${episodio.temporada.numero} EP${episodio.numero}`
    }))
  };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    exigirPapel(locals.usuario?.papel, 'EDITOR');

    const formulario = await request.formData();
    const episodioId = String(formulario.get('episodioId') ?? '');
    const arquivo = formulario.get('arquivo');

    if (!(arquivo instanceof File) || arquivo.size === 0) {
      return fail(400, { mensagem: 'Escolha um arquivo de vídeo.' });
    }

    try {
      const registro = await gravarUpload(episodioId, arquivo);
      await registrarAcaoAdministrativa(
        locals.usuario!.id,
        'enviar-video',
        episodioId,
        arquivo.name
      );

      // Sem await: transcodificar 3 variantes leva minutos e a resposta nao pode esperar.
      void processarArquivo(registro.id);

      return { mensagem: 'Arquivo recebido. A conversão para HLS começou.' };
    } catch (erro) {
      return fail(400, { mensagem: erro instanceof Error ? erro.message : 'Falha no envio.' });
    }
  }
};
