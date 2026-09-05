// Arquivo: src/lib/cliente/fila-de-envio.ts
// Fila de envio de video no navegador. Cada arquivo e um trabalho proprio.
//
// Antes o envio era uma action de formulario: a aba ficava presa na requisicao, nao
// havia porcentagem nenhuma e o lote inteiro era um POST so — caiu no decimo arquivo,
// perdeu os dez anteriores. Aqui vale o padrao que as plataformas de video usam:
// uma linha por arquivo, com estado proprio; algumas subindo ao mesmo tempo e o resto
// esperando vaga; reenvio SO do que falhou; e o progresso agregado contado em BYTES,
// nao em quantidade de arquivos — dez arquivos de 20 MB e um de 4 GB nao sao "11
// itens, 90% pronto".
//
// Tres de cada vez porque o navegador limita as conexoes simultaneas por host: abrir
// doze nao envia mais rapido, so faz as doze barras andarem devagar juntas.

import { writable, derived, get, type Readable } from 'svelte/store';

export type SituacaoDoEnvio = 'na-fila' | 'enviando' | 'concluido' | 'falhou' | 'cancelado';

export interface EnvioNaFila {
  id: string;
  episodioId: string;
  /** Rotulo legivel do destino, pro painel nao mostrar so um cuid. */
  destino: string;
  nomeDoArquivo: string;
  bytes: number;
  enviados: number;
  situacao: SituacaoDoEnvio;
  erro?: string;
}

const SIMULTANEOS = 3;

const fila = writable<EnvioNaFila[]>([]);
/** Requisicoes em voo, pra dar conta de cancelar. */
const emVoo = new Map<string, XMLHttpRequest>();

export const envios: Readable<EnvioNaFila[]> = { subscribe: fila.subscribe };

/** Resumo do painel: contagem por estado e porcentagem por bytes. */
export const resumoDosEnvios = derived(fila, (itens) => {
  const ativos = itens.filter(
    (item) => item.situacao === 'na-fila' || item.situacao === 'enviando'
  );
  const total = ativos.reduce((soma, item) => soma + item.bytes, 0);
  const feito = ativos.reduce((soma, item) => soma + item.enviados, 0);

  return {
    total: itens.length,
    ativos: ativos.length,
    concluidos: itens.filter((item) => item.situacao === 'concluido').length,
    falhados: itens.filter((item) => item.situacao === 'falhou').length,
    porcentagem: total === 0 ? 0 : Math.round((feito / total) * 100)
  };
});

function alterar(id: string, mudanca: Partial<EnvioNaFila>) {
  fila.update((itens) => itens.map((item) => (item.id === id ? { ...item, ...mudanca } : item)));
}

/** Sobe um item e devolve quando ele termina — com erro ou sem. */
function enviarItem(item: EnvioNaFila, arquivo: File): Promise<void> {
  return new Promise((terminar) => {
    const requisicao = new XMLHttpRequest();
    emVoo.set(item.id, requisicao);

    const endereco =
      `/api/admin/envio?episodio=${encodeURIComponent(item.episodioId)}` +
      `&nome=${encodeURIComponent(item.nomeDoArquivo)}`;

    requisicao.open('POST', endereco);
    requisicao.setRequestHeader('content-type', 'application/octet-stream');

    // `upload.onprogress` e o unico lugar que conhece os bytes que ja sairam da
    // maquina. O `onprogress` da resposta contaria a volta, que aqui e um json curto.
    requisicao.upload.onprogress = (evento) => {
      if (evento.lengthComputable) alterar(item.id, { enviados: evento.loaded });
    };

    requisicao.onload = () => {
      emVoo.delete(item.id);
      if (requisicao.status >= 200 && requisicao.status < 300) {
        alterar(item.id, { situacao: 'concluido', enviados: item.bytes });
      } else {
        alterar(item.id, { situacao: 'falhou', erro: mensagemDoErro(requisicao) });
      }
      terminar();
    };

    requisicao.onerror = () => {
      emVoo.delete(item.id);
      alterar(item.id, { situacao: 'falhou', erro: 'A conexão caiu durante o envio.' });
      terminar();
    };

    requisicao.onabort = () => {
      emVoo.delete(item.id);
      terminar();
    };

    alterar(item.id, { situacao: 'enviando', erro: undefined });
    requisicao.send(arquivo);
  });
}

function mensagemDoErro(requisicao: XMLHttpRequest): string {
  try {
    const corpo = JSON.parse(requisicao.responseText) as { message?: string };
    if (corpo.message) return corpo.message;
  } catch {
    // Resposta que nao e json (413 do proxy, por exemplo): cai no texto padrao.
  }
  return `O servidor respondeu ${requisicao.status || 'sem código'}.`;
}

/** Bytes do arquivo ficam fora do store: File nao precisa virar estado reativo. */
const arquivos = new Map<string, File>();

let operarios = 0;

/** Proximo da fila, ou nada. */
function proximo(): EnvioNaFila | undefined {
  return get(fila).find((item) => item.situacao === 'na-fila');
}

/**
 * Cada operario puxa um item, envia, e volta pra pegar o proximo. Sao operarios em
 * vez de lotes de tres porque com lote a vaga so abriria quando os TRES terminassem:
 * dois arquivos pequenos ficariam esperando um de 4 GB pra liberar a fila.
 */
async function trabalhar() {
  for (;;) {
    const item = proximo();
    if (!item) return;

    const arquivo = arquivos.get(item.id);
    if (!arquivo) {
      alterar(item.id, { situacao: 'falhou', erro: 'O arquivo saiu da memória.' });
      continue;
    }

    // Marca antes de enviar: sem isso dois operarios pegariam o mesmo item, porque
    // `enviarItem` so muda a situacao depois de abrir a requisicao.
    alterar(item.id, { situacao: 'enviando' });
    await enviarItem(item, arquivo);
  }
}

function girar() {
  while (operarios < SIMULTANEOS && proximo()) {
    operarios += 1;
    void trabalhar().finally(() => {
      operarios -= 1;
    });
  }
}

export function enfileirarEnvio(episodioId: string, destino: string, arquivo: File): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  arquivos.set(id, arquivo);

  fila.update((itens) => [
    ...itens,
    {
      id,
      episodioId,
      destino,
      nomeDoArquivo: arquivo.name,
      bytes: arquivo.size,
      enviados: 0,
      situacao: 'na-fila'
    }
  ]);

  girar();
  return id;
}

/** Reenvia so o que falhou: o que ja subiu nao sobe de novo. */
export function reenviar(id: string) {
  alterar(id, { situacao: 'na-fila', enviados: 0, erro: undefined });
  girar();
}

export function cancelarEnvio(id: string) {
  emVoo.get(id)?.abort();
  alterar(id, { situacao: 'cancelado' });
  arquivos.delete(id);
  girar();
}

/** Tira da lista o que ja terminou. O que ainda corre fica. */
export function limparConcluidos() {
  fila.update((itens) =>
    itens.filter((item) => {
      const terminou = item.situacao === 'concluido' || item.situacao === 'cancelado';
      if (terminou) arquivos.delete(item.id);
      return !terminou;
    })
  );
}
