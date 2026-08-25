// Arquivo: src/lib/servidor/armazenamento/gravar-upload.ts
// Grava o arquivo enviado fora de static/ (nada de expor original ao publico) e devolve
// o registro no banco. Quem transcodifica le daqui.

import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { banco } from '../banco/cliente.js';

const EXTENSOES_ACEITAS = new Set(['.mp4', '.mkv', '.mov', '.webm']);
export const TAMANHO_MAXIMO_BYTES = 8 * 1024 * 1024 * 1024;

export function extensaoAceita(nome: string): boolean {
  return EXTENSOES_ACEITAS.has(extname(nome).toLowerCase());
}

export async function gravarUpload(episodioId: string, arquivo: File) {
  if (!extensaoAceita(arquivo.name)) throw new Error('Formato de vídeo não aceito.');
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) throw new Error('Arquivo acima do limite.');

  const pasta = process.env.PASTA_UPLOADS ?? './midia/originais';
  await mkdir(pasta, { recursive: true });

  const caminho = join(pasta, `${randomUUID()}${extname(arquivo.name).toLowerCase()}`);
  await writeFile(caminho, Buffer.from(await arquivo.arrayBuffer()));

  return banco.arquivoMidia.create({
    data: { episodioId, caminho, tamanhoBytes: arquivo.size }
  });
}
