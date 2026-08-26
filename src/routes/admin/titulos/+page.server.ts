// Arquivo: src/routes/admin/titulos/+page.server.ts
// Lista e criacao de titulos. O portao de papel esta no +layout.server.ts do admin,
// mas criar exige EDITOR explicitamente: layout protege a tela, action protege o dado.

import { fail, redirect } from '@sveltejs/kit';
import {
  criarTitulo,
  ErroDeAdministracao,
  listarTitulosDoPainel
} from '$servidor/banco/administracao';
import { listarGeneros } from '$servidor/banco/catalogo';
import { registrarAcaoAdministrativa } from '$servidor/autenticacao/confirmacao';
import { exigirPapel } from '$servidor/permissoes/papeis';
import {
  sugerirSlug,
  validarAno,
  validarClassificacao,
  validarNomeDeTitulo,
  validarSinopse,
  validarSituacao,
  validarSlug
} from '$lib/validacoes/administracao';
import { ErroDeValidacao } from '$lib/validacoes/erro-validacao';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const busca = url.searchParams.get('busca')?.trim() || undefined;
  const [titulos, generos] = await Promise.all([listarTitulosDoPainel(busca), listarGeneros()]);
  return { titulos, generos, busca: busca ?? '' };
};

export const actions: Actions = {
  criar: async ({ request, locals }) => {
    exigirPapel(locals.usuario?.papel, 'EDITOR');
    const formulario = await request.formData();
    const nome = String(formulario.get('nome') ?? '');

    try {
      const dados = {
        nome: validarNomeDeTitulo(nome),
        // Slug em branco vira sugestao a partir do nome: um campo a menos pra errar.
        slug: validarSlug(String(formulario.get('slug') ?? '').trim() || sugerirSlug(nome)),
        sinopse: validarSinopse(formulario.get('sinopse')),
        ano: validarAno(formulario.get('ano')),
        classificacao: validarClassificacao(formulario.get('classificacao')),
        situacao: validarSituacao(formulario.get('situacao')),
        destaque: formulario.get('destaque') === 'on',
        novidade: formulario.get('novidade') === 'on',
        emAlta: formulario.get('emAlta') === 'on',
        popularidade: 0
      };

      const criado = await criarTitulo(dados, formulario.getAll('generos').map(String));
      await registrarAcaoAdministrativa(locals.usuario!.id, 'criar-titulo', criado.id, criado.nome);
      throw redirect(303, `/admin/titulos/${criado.id}`);
    } catch (erro) {
      if (erro instanceof ErroDeValidacao || erro instanceof ErroDeAdministracao) {
        return fail(400, { mensagem: erro.message });
      }
      throw erro;
    }
  }
};
