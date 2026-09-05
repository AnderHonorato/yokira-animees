// Arquivo: src/lib/servidor/armazenamento/gravar-fluxo.ts
// Grava o video direto do corpo da requisicao pro disco, sem passar pela memoria.
//
// O caminho antigo (`gravarUpload`) faz `Buffer.from(await arquivo.arrayBuffer())`:
// o arquivo inteiro vira um Buffer na RAM antes de tocar o disco. Com um episodio de
// 1,5 GB isso ja e ruim; com o lote de doze arquivos num POST so, o servidor tentava
// segurar os doze de uma vez. Aqui os bytes atravessam: chegam da rede e caem no
// arquivo, num fluxo so, e a memoria usada e a do buffer do stream.
//
// A funcao antiga continua existindo — o envio por LINK baixa pra um Buffer e usa
// ela, e nao vale reescrever aquele caminho pra ganhar nada.

import { createWriteStream } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { banco } from '../banco/cliente.js';
import { TAMANHO_MAXIMO_BYTES, extensaoAceita } from './gravar-upload.js';

/** Conta os bytes que passam e interrompe assim que estourar o teto. */
function contarBytes(aoPassar: (total: number) => void) {
  let total = 0;
  return new Transform({
    transform(pedaco: Buffer, _codificacao, pronto) {
      total += pedaco.length;
      if (total > TAMANHO_MAXIMO_BYTES) {
        // Cortar aqui e o que impede um upload sem fim de encher o disco: o limite
        // vale mesmo quando o cliente mente no content-length.
        pronto(new Error('Arquivo acima do limite.'));
        return;
      }
      aoPassar(total);
      pronto(null, pedaco);
    }
  });
}

export async function gravarFluxo(
  episodioId: string,
  nome: string,
  corpo: ReadableStream<Uint8Array>
) {
  if (!extensaoAceita(nome)) throw new Error('Formato de vídeo não aceito.');

  const pasta = process.env.PASTA_UPLOADS ?? './midia/originais';
  await mkdir(pasta, { recursive: true });

  // Nome sorteado: o nome de origem entraria num caminho de disco e vem de fora.
  // So a extensao, ja validada contra a lista fechada, sobrevive.
  const caminho = join(pasta, `${randomUUID()}${extname(nome).toLowerCase()}`);
  let gravados = 0;

  try {
    await pipeline(
      Readable.fromWeb(corpo as Parameters<typeof Readable.fromWeb>[0]),
      contarBytes((total) => (gravados = total)),
      createWriteStream(caminho)
    );
  } catch (erro) {
    // Meio arquivo no disco e pior que nenhum: o proximo envio teria um original
    // truncado esperando conversao.
    await unlink(caminho).catch(() => undefined);
    throw erro;
  }

  if (gravados === 0) {
    await unlink(caminho).catch(() => undefined);
    throw new Error('Arquivo vazio.');
  }

  return banco.arquivoMidia.create({
    data: { episodioId, caminho, tamanhoBytes: BigInt(gravados) }
  });
}
