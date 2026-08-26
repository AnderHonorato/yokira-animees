// Arquivo: src/lib/servidor/banco/administracao.ts
// Escritas do painel sobre CONTEUDO: titulos, temporadas e episodios.
// Pessoas (usuarios, papeis, denuncias, registro) ficam em administracao-pessoas.ts —
// eixos diferentes, e junto o arquivo passava das 180 linhas.
//
// Rota nao fala com Prisma direto: assim a regra de "quem pode o que" fica na rota
// e a forma dos dados fica aqui.

import { banco } from './cliente.js';
import type { SituacaoTitulo } from './gerado/enums.js';

export class ErroDeAdministracao extends Error {}

export interface DadosDeTitulo {
  slug: string;
  nome: string;
  sinopse: string;
  ano: number;
  classificacao: string;
  situacao: SituacaoTitulo;
  destaque: boolean;
  novidade: boolean;
  emAlta: boolean;
  popularidade: number;
}

export async function listarTitulosDoPainel(busca?: string) {
  return banco.titulo.findMany({
    where: busca ? { nome: { contains: busca } } : undefined,
    orderBy: { atualizadoEm: 'desc' },
    take: 100,
    select: {
      id: true,
      slug: true,
      nome: true,
      ano: true,
      situacao: true,
      destaque: true,
      atualizadoEm: true,
      _count: { select: { temporadas: true } }
    }
  });
}

export async function lerTituloDoPainel(id: string) {
  return banco.titulo.findUnique({
    where: { id },
    include: {
      generos: { select: { generoId: true } },
      temporadas: {
        orderBy: { numero: 'asc' },
        include: {
          episodios: {
            orderBy: { numero: 'asc' },
            select: {
              id: true,
              numero: true,
              nome: true,
              duracaoSegundos: true,
              _count: { select: { arquivos: true } }
            }
          }
        }
      }
    }
  });
}

async function garantirSlugLivre(slug: string, exceto?: string): Promise<void> {
  const existente = await banco.titulo.findUnique({ where: { slug }, select: { id: true } });
  if (existente && existente.id !== exceto) {
    throw new ErroDeAdministracao('Ja existe um titulo com este slug.');
  }
}

export async function criarTitulo(dados: DadosDeTitulo, generoIds: string[]) {
  await garantirSlugLivre(dados.slug);
  return banco.titulo.create({
    data: {
      ...dados,
      generos: { create: generoIds.map((generoId) => ({ generoId })) }
    }
  });
}

export async function atualizarTitulo(id: string, dados: DadosDeTitulo, generoIds: string[]) {
  await garantirSlugLivre(dados.slug, id);
  // Trocar o conjunto inteiro em vez de calcular diferenca: sao poucos generos por
  // titulo e o calculo erraria mais do que economizaria.
  return banco.$transaction([
    banco.tituloGenero.deleteMany({ where: { tituloId: id } }),
    banco.titulo.update({
      data: { ...dados, generos: { create: generoIds.map((generoId) => ({ generoId })) } },
      where: { id }
    })
  ]);
}

export async function criarTemporada(tituloId: string, numero: number, nome: string) {
  const jaExiste = await banco.temporada.findUnique({
    where: { tituloId_numero: { tituloId, numero } },
    select: { id: true }
  });
  if (jaExiste) throw new ErroDeAdministracao(`A temporada ${numero} ja existe neste titulo.`);

  return banco.temporada.create({ data: { tituloId, numero, nome } });
}

export async function criarEpisodio(
  temporadaId: string,
  numero: number,
  nome: string,
  duracaoSegundos: number
) {
  const jaExiste = await banco.episodio.findFirst({
    where: { temporadaId, numero },
    select: { id: true }
  });
  if (jaExiste) throw new ErroDeAdministracao(`O episodio ${numero} ja existe nesta temporada.`);

  return banco.episodio.create({ data: { temporadaId, numero, nome, duracaoSegundos } });
}

export async function atualizarEpisodio(
  id: string,
  numero: number,
  nome: string,
  duracaoSegundos: number
) {
  return banco.episodio.update({ data: { numero, nome, duracaoSegundos }, where: { id } });
}
