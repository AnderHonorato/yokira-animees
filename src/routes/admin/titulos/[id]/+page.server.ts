// Arquivo: src/routes/admin/titulos/[id]/+page.server.ts
// Edicao do titulo e de tudo que pendura nele. As acoes que APAGAM nao estao aqui:
// vao pelo /api/admin, que exige o token da dupla confirmacao.

import { error, fail } from '@sveltejs/kit';
import {
  atualizarEpisodio,
  definirCapaDoTitulo,
  definirMiniaturaDoEpisodio,
  atualizarTitulo,
  criarEpisodio,
  criarTemporada,
  ErroDeAdministracao,
  lerTituloDoPainel
} from '$servidor/banco/administracao';
import { listarGeneros } from '$servidor/banco/catalogo';
import { registrarAcaoAdministrativa } from '$servidor/autenticacao/confirmacao';
import { exigirPapel } from '$servidor/permissoes/papeis';
import { lerOrigemDoFormulario, resolverCapa } from '$servidor/midia/definir-capa';
import {
  validarAno,
  validarClassificacao,
  validarDataDeEstreia,
  validarDuracaoEmMinutos,
  validarNomeDeTitulo,
  validarNumeroDeEpisodio,
  validarNumeroDeTemporada,
  validarPopularidade,
  validarSinopse,
  validarSituacao,
  validarSlug
} from '$lib/validacoes/administracao';
import { ErroDeValidacao, exigirTexto } from '$lib/validacoes/erro-validacao';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const [titulo, generos] = await Promise.all([lerTituloDoPainel(params.id), listarGeneros()]);
  if (!titulo) throw error(404, 'Título não encontrado.');
  return { titulo, generos };
};

/** Roda a acao traduzindo os erros conhecidos em fail(400) em vez de 500. */
async function comErroTratado<T>(executar: () => Promise<T>) {
  try {
    return await executar();
  } catch (erro) {
    if (erro instanceof ErroDeValidacao || erro instanceof ErroDeAdministracao) {
      return fail(400, { mensagem: erro.message });
    }
    throw erro;
  }
}

export const actions: Actions = {
  salvar: async ({ request, params, locals }) => {
    exigirPapel(locals.usuario?.papel, 'EDITOR');
    const formulario = await request.formData();

    return comErroTratado(async () => {
      await atualizarTitulo(
        params.id,
        {
          nome: validarNomeDeTitulo(formulario.get('nome')),
          slug: validarSlug(formulario.get('slug')),
          sinopse: validarSinopse(formulario.get('sinopse')),
          ano: validarAno(formulario.get('ano')),
          classificacao: validarClassificacao(formulario.get('classificacao')),
          situacao: validarSituacao(formulario.get('situacao')),
          destaque: formulario.get('destaque') === 'on',
          novidade: formulario.get('novidade') === 'on',
          emAlta: formulario.get('emAlta') === 'on',
          popularidade: validarPopularidade(formulario.get('popularidade'))
        },
        formulario.getAll('generos').map(String)
      );
      await registrarAcaoAdministrativa(locals.usuario!.id, 'editar-titulo', params.id);
      return { mensagem: 'Título salvo.' };
    });
  },

  criarTemporada: async ({ request, params, locals }) => {
    exigirPapel(locals.usuario?.papel, 'EDITOR');
    const formulario = await request.formData();

    return comErroTratado(async () => {
      const numero = validarNumeroDeTemporada(formulario.get('numero'));
      const temporada = await criarTemporada(
        params.id,
        numero,
        exigirTexto(formulario.get('nome'), 'nome', 80)
      );
      await registrarAcaoAdministrativa(locals.usuario!.id, 'criar-temporada', temporada.id);
      return { mensagem: `Temporada ${numero} criada.` };
    });
  },

  criarEpisodio: async ({ request, locals }) => {
    exigirPapel(locals.usuario?.papel, 'EDITOR');
    const formulario = await request.formData();

    return comErroTratado(async () => {
      const numero = validarNumeroDeEpisodio(formulario.get('numero'));
      const episodio = await criarEpisodio(
        exigirTexto(formulario.get('temporadaId'), 'temporadaId', 60),
        numero,
        exigirTexto(formulario.get('nome'), 'nome', 160),
        validarDuracaoEmMinutos(formulario.get('duracao')) * 60,
        validarDataDeEstreia(formulario.get('estreia'))
      );
      await registrarAcaoAdministrativa(locals.usuario!.id, 'criar-episodio', episodio.id);
      return { mensagem: `Episódio ${numero} criado.` };
    });
  },

  definirCapa: async ({ request, locals, params }) => {
    exigirPapel(locals.usuario?.papel, 'EDITOR');
    const formulario = await request.formData();

    return comErroTratado(async () => {
      const alvo = formulario.get('alvo') === 'hero' ? 'hero' : 'poster';
      const url = await resolverCapa(lerOrigemDoFormulario(formulario));
      await definirCapaDoTitulo(params.id, alvo, url);
      await registrarAcaoAdministrativa(locals.usuario!.id, `definir-capa-${alvo}`, params.id);
      return { mensagem: alvo === 'hero' ? 'Arte do topo trocada.' : 'Pôster trocado.' };
    });
  },

  definirMiniatura: async ({ request, locals }) => {
    exigirPapel(locals.usuario?.papel, 'EDITOR');
    const formulario = await request.formData();

    return comErroTratado(async () => {
      const id = exigirTexto(formulario.get('episodioId'), 'episodioId', 60);
      // Sem episodio escolhido pro quadro, o recorte vem do video do proprio episodio.
      const origem = lerOrigemDoFormulario(formulario);
      const url = await resolverCapa({ ...origem, episodioId: origem.episodioId ?? id });
      await definirMiniaturaDoEpisodio(id, url);
      await registrarAcaoAdministrativa(locals.usuario!.id, 'definir-miniatura', id);
      return { mensagem: 'Miniatura do episódio trocada.' };
    });
  },

  salvarEpisodio: async ({ request, locals }) => {
    exigirPapel(locals.usuario?.papel, 'EDITOR');
    const formulario = await request.formData();

    return comErroTratado(async () => {
      const id = exigirTexto(formulario.get('episodioId'), 'episodioId', 60);
      await atualizarEpisodio(
        id,
        validarNumeroDeEpisodio(formulario.get('numero')),
        exigirTexto(formulario.get('nome'), 'nome', 160),
        validarDuracaoEmMinutos(formulario.get('duracao')) * 60,
        validarDataDeEstreia(formulario.get('estreia'))
      );
      await registrarAcaoAdministrativa(locals.usuario!.id, 'editar-episodio', id);
      return { mensagem: 'Episódio salvo.' };
    });
  }
};
