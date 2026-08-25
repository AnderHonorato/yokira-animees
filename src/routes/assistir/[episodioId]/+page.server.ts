// Arquivo: src/routes/assistir/[episodioId]/+page.server.ts

import { error } from '@sveltejs/kit';
import { banco } from '$servidor/banco/cliente';
import { lerProgresso } from '$servidor/banco/progresso';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const episodio = await banco.episodio.findUnique({
    where: { id: params.episodioId },
    include: {
      temporada: { include: { titulo: true } },
      arquivos: { include: { variantes: true } }
    }
  });

  if (!episodio) throw error(404, 'Episódio não encontrado.');

  const progresso = locals.usuario ? await lerProgresso(locals.usuario.id, episodio.id) : null;
  const primeiraVariante = episodio.arquivos[0]?.variantes[0];

  return {
    episodio: {
      id: episodio.id,
      numero: episodio.numero,
      nome: episodio.nome,
      duracaoMinutos: Math.round(episodio.duracaoSegundos / 60)
    },
    titulo: { nome: episodio.temporada.titulo.nome, slug: episodio.temporada.titulo.slug },
    temporada: episodio.temporada.numero,
    playlist: primeiraVariante?.playlist ?? null,
    segundoInicial: progresso?.segundos ?? 0
  };
};
