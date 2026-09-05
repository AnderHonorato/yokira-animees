// Arquivo: testes/unitarios/fila-de-processamento.teste.ts
// A fila do ffmpeg existe pra uma coisa so: nao deixar duas conversoes brigarem
// pelos mesmos nucleos. Sem este teste, trocar o limite por engano (ou perder o
// `await` de dentro dela) nao quebraria nada visivel — so deixaria tudo mais lento.

import { describe, expect, it, vi } from 'vitest';

/**
 * Modulo novo a cada teste. O contador de vagas e o limite sao estado de MODULO: sem
 * limpar o registro, o segundo teste herdaria a fila do primeiro e o limite lido na
 * primeira importacao.
 */
async function carregarFila(simultaneas: string) {
  process.env.TRANSCODIFICACOES_SIMULTANEAS = simultaneas;
  vi.resetModules();
  return import('../../src/lib/servidor/processamento/fila');
}

function tarefaControlada() {
  let liberar!: () => void;
  const espera = new Promise<void>((resolver) => (liberar = resolver));
  return { espera, liberar };
}

describe('fila de processamento', () => {
  it('com limite 1, a segunda tarefa so comeca quando a primeira termina', async () => {
    const { naFila } = await carregarFila('1');
    const ordem: string[] = [];
    const primeira = tarefaControlada();

    const umaPromessa = naFila(async () => {
      ordem.push('entrou 1');
      await primeira.espera;
      ordem.push('saiu 1');
    });

    const outraPromessa = naFila(async () => {
      ordem.push('entrou 2');
    });

    // Um tique do laco de eventos: se a fila nao segurasse, a segunda ja teria rodado.
    await Promise.resolve();
    expect(ordem).toEqual(['entrou 1']);

    primeira.liberar();
    await Promise.all([umaPromessa, outraPromessa]);
    expect(ordem).toEqual(['entrou 1', 'saiu 1', 'entrou 2']);
  });

  it('conta quem roda e quem espera', async () => {
    const { naFila, situacaoDaFila } = await carregarFila('1');
    const presa = tarefaControlada();

    const primeira = naFila(() => presa.espera);
    const segunda = naFila(async () => undefined);
    await Promise.resolve();

    expect(situacaoDaFila()).toMatchObject({ rodando: 1, esperando: 1, limite: 1 });

    presa.liberar();
    await Promise.all([primeira, segunda]);
    expect(situacaoDaFila()).toMatchObject({ rodando: 0, esperando: 0 });
  });

  it('uma tarefa que estoura nao trava a vaga da proxima', async () => {
    const { naFila, situacaoDaFila } = await carregarFila('1');

    await expect(
      naFila(async () => {
        throw new Error('ffmpeg caiu');
      })
    ).rejects.toThrow('ffmpeg caiu');

    await naFila(async () => undefined);
    expect(situacaoDaFila().rodando).toBe(0);
  });
});
