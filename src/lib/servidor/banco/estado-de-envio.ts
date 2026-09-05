// Arquivo: src/lib/servidor/banco/estado-de-envio.ts
// Em que pe esta o video de cada episodio. Uma consulta so para a temporada inteira,
// e nao uma por linha: uma temporada de 24 episodios viraria 24 idas ao banco a cada
// atualizacao da tela.

import { banco } from './cliente.js';

export type SituacaoDoVideo = 'sem-video' | 'na-fila' | 'convertendo' | 'pronto' | 'falhou';

export interface EstadoDoVideo {
  situacao: SituacaoDoVideo;
  /** 0 a 100. So faz sentido em `convertendo`. */
  progresso: number;
  mensagem?: string;
}

const TRADUCAO: Record<string, SituacaoDoVideo> = {
  NA_FILA: 'na-fila',
  PROCESSANDO: 'convertendo',
  CONCLUIDO: 'pronto',
  FALHOU: 'falhou'
};

export async function estadoDosEpisodios(ids: string[]): Promise<Record<string, EstadoDoVideo>> {
  const arquivos = await banco.arquivoMidia.findMany({
    where: { episodioId: { in: ids } },
    orderBy: { criadoEm: 'asc' },
    select: {
      episodioId: true,
      variantes: { select: { id: true } },
      trabalhos: { orderBy: { criadoEm: 'desc' }, take: 1 }
    }
  });

  const estado: Record<string, EstadoDoVideo> = {};
  for (const id of ids) estado[id] = { situacao: 'sem-video', progresso: 0 };

  for (const arquivo of arquivos) {
    const trabalho = arquivo.trabalhos[0];

    // Sem trabalho registrado mas com variante no lugar: e um arquivo antigo, de
    // antes da fila. Ele esta pronto, e dizer "sem vídeo" seria mentira.
    if (!trabalho) {
      if (arquivo.variantes.length > 0)
        estado[arquivo.episodioId] = { situacao: 'pronto', progresso: 100 };
      continue;
    }

    estado[arquivo.episodioId] = {
      situacao: TRADUCAO[trabalho.situacao] ?? 'na-fila',
      progresso: trabalho.progresso,
      mensagem: trabalho.mensagem ?? undefined
    };
  }

  return estado;
}
