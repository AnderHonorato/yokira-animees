// Arquivo: src/lib/servidor/processamento/fila.ts
// Fila com concorrencia limitada para o ffmpeg.
//
// Antes cada envio chamava `processarArquivo` direto, sem await e sem limite: um lote
// de doze episodios abria doze ffmpeg ao mesmo tempo. Eles nao "rodam em paralelo" —
// disputam os mesmos nucleos, e o resultado e que os doze ficam lentos juntos e o
// primeiro, que poderia estar pronto em dois minutos, termina depois de meia hora.
//
// Uma tarefa de cada vez e o padrao, porque o ffmpeg ja usa todos os nucleos que
// encontra. Quem tem maquina sobrando aumenta em TRANSCODIFICACOES_SIMULTANEAS.

const LIMITE = Math.max(1, Number(process.env.TRANSCODIFICACOES_SIMULTANEAS ?? 1));

let rodando = 0;
const esperando: Array<() => void> = [];

/** Quantas tarefas correm e quantas aguardam vaga. A tela do painel mostra isso. */
export function situacaoDaFila(): { rodando: number; esperando: number; limite: number } {
  return { rodando, esperando: esperando.length, limite: LIMITE };
}

/**
 * Roda a tarefa quando houver vaga. A promessa devolvida so resolve no fim da
 * tarefa, entao quem chamar com `void` continua sem esperar — que e o caso do
 * envio: a resposta HTTP nao pode ficar presa a uma conversao de minutos.
 */
export async function naFila<T>(tarefa: () => Promise<T>): Promise<T> {
  if (rodando >= LIMITE) {
    await new Promise<void>((liberar) => esperando.push(liberar));
  }

  rodando += 1;
  try {
    return await tarefa();
  } finally {
    rodando -= 1;
    // A proxima da fila entra no lugar. `shift` mantem a ordem de chegada: quem
    // enviou primeiro converte primeiro, que e o que a pessoa espera ver.
    esperando.shift()?.();
  }
}
