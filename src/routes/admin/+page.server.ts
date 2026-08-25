// Arquivo: src/routes/admin/+page.server.ts

import { banco } from '$servidor/banco/cliente';
import { ffmpegDisponivel } from '$servidor/processamento/transcodificar';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const [titulos, episodios, trabalhos, temFfmpeg] = await Promise.all([
    banco.titulo.count(),
    banco.episodio.count(),
    banco.trabalhoProcessamento.findMany({ orderBy: { criadoEm: 'desc' }, take: 10 }),
    ffmpegDisponivel()
  ]);

  return { titulos, episodios, trabalhos, temFfmpeg };
};
