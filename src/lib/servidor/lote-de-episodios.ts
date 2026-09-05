// Arquivo: src/lib/servidor/lote-de-episodios.ts
// Executa o plano do lote: cria os episodios e, quando o item traz video, ja manda pro
// mesmo caminho do envio avulso. Fica fora de banco/ porque toca as tres camadas —
// banco, armazenamento e processamento — e nao seria honesto morar em nenhuma delas.

import { banco } from './banco/cliente.js';
import {
  montarPlano,
  separarLinks,
  type IntervaloDeEstreia,
  type ItemDoLote
} from './banco/plano-do-lote.js';
import { validarDataDeEstreia, validarNumeroDeEpisodio } from '../validacoes/administracao.js';
import { baixarVideo } from './armazenamento/baixar-de-url.js';
import { gravarBytes, gravarUpload } from './armazenamento/gravar-upload.js';
import { processarArquivo } from './processamento/transcodificar.js';

export interface ResultadoDoLote {
  criados: number;
  comVideo: number;
  /** Uma linha por item que falhou, pra tela dizer qual e por que. */
  falhas: string[];
}

/** Anexa o video do item, se houver. Devolve a falha em texto em vez de lancar. */
async function anexarVideo(
  episodioId: string,
  item: ItemDoLote,
  arquivo: File | undefined
): Promise<string | null> {
  try {
    if (arquivo && arquivo.size > 0) {
      const registro = await gravarUpload(episodioId, arquivo);
      void processarArquivo(registro.id);
      return null;
    }

    if (!item.link) return null;

    const baixado = await baixarVideo(item.link);
    const registro = await gravarBytes(episodioId, baixado.bytes, baixado.nome);
    // Sem await: transcodificar tres variantes leva minutos por episodio, e o lote
    // inteiro seguraria a resposta ate o ultimo terminar.
    void processarArquivo(registro.id);
    return null;
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.message : 'falha desconhecida';
    return `Episódio ${item.numero}: ${motivo}`;
  }
}

export async function executarLote(
  temporadaId: string,
  plano: ItemDoLote[],
  arquivos: File[] = []
): Promise<ResultadoDoLote> {
  const resultado: ResultadoDoLote = { criados: 0, comVideo: 0, falhas: [] };

  const jaUsados = await banco.episodio.findMany({
    where: { temporadaId },
    select: { numero: true }
  });
  const ocupados = new Set(jaUsados.map((episodio) => episodio.numero));

  for (const [posicao, item] of plano.entries()) {
    // Numero repetido nao derruba o lote inteiro: o resto continua e a tela lista.
    if (ocupados.has(item.numero)) {
      resultado.falhas.push(`Episódio ${item.numero}: já existe nesta temporada.`);
      continue;
    }

    const episodio = await banco.episodio.create({
      data: {
        temporadaId,
        numero: item.numero,
        nome: item.nome,
        duracaoSegundos: 0,
        publicadoEm: item.publicadoEm
      }
    });
    ocupados.add(item.numero);
    resultado.criados += 1;

    const falha = await anexarVideo(episodio.id, item, arquivos[posicao]);
    if (falha) resultado.falhas.push(falha);
    else if (item.link || arquivos[posicao]) resultado.comVideo += 1;
  }

  return resultado;
}

export interface LoteLido {
  temporadaId: string;
  plano: ItemDoLote[];
  arquivos: File[];
}

/** Le os campos do formulario de lote. Fora da rota pra a acao caber em poucas linhas. */
export function lerLoteDoFormulario(formulario: FormData): LoteLido {
  const arquivos = formulario
    .getAll('arquivos')
    .filter((item): item is File => item instanceof File && item.size > 0);

  return {
    temporadaId: String(formulario.get('temporadaId') ?? ''),
    arquivos,
    plano: montarPlano({
      numeroInicial: validarNumeroDeEpisodio(formulario.get('numeroInicial') ?? 1),
      // Com arquivos escolhidos sao eles que dizem quantos episodios sao.
      quantidade: arquivos.length > 0 ? arquivos.length : Number(formulario.get('quantidade') ?? 0),
      links: separarLinks(String(formulario.get('links') ?? '')),
      primeiraEstreia: validarDataDeEstreia(formulario.get('estreia')),
      intervalo: (formulario.get('intervalo') ?? 'nenhum') as IntervaloDeEstreia
    })
  };
}

/**
 * Texto do resultado. As falhas vao na mesma frase de proposito: um lote parcial que
 * se anuncia como sucesso e como o cadastro fica errado sem ninguem perceber.
 */
export function resumoDoLote(resultado: ResultadoDoLote): string {
  const base = `${resultado.criados} episódio(s) criado(s), ${resultado.comVideo} com vídeo.`;
  return resultado.falhas.length > 0 ? `${base} Falhas: ${resultado.falhas.join(' ')}` : base;
}

/** Proximo numero livre da temporada. O lote continua de onde a temporada parou. */
async function proximoNumeroLivre(temporadaId: string): Promise<number> {
  const ultimo = await banco.episodio.findFirst({
    where: { temporadaId },
    orderBy: { numero: 'desc' },
    select: { numero: true }
  });
  return (ultimo?.numero ?? 0) + 1;
}

/**
 * Cria um episodio VAZIO por arquivo escolhido e devolve os ids na mesma ordem.
 *
 * Serve ao envio em lote da tela do titulo: os episodios nascem aqui, numa
 * requisicao curta, e os videos sobem depois, um por vez, pela fila do navegador.
 * Antes os dois aconteciam no mesmo POST — o cadastro so existia quando o ultimo
 * byte do ultimo arquivo chegava, e uma queda no meio nao deixava nem os episodios.
 *
 * O nome sai do arquivo porque e o que a pessoa reconhece na hora de conferir;
 * renomear depois e um clique em "Editar".
 */
export async function criarEpisodiosParaArquivos(temporadaId: string, nomesDeArquivo: string[]) {
  const inicio = await proximoNumeroLivre(temporadaId);
  const criados = [];

  for (const [posicao, nomeDeArquivo] of nomesDeArquivo.entries()) {
    const numero = inicio + posicao;
    const semExtensao = nomeDeArquivo.replace(/\.[^./\\]+$/, '').trim();
    const episodio = await banco.episodio.create({
      data: {
        temporadaId,
        numero,
        nome: (semExtensao || `Episódio ${numero}`).slice(0, 160),
        duracaoSegundos: 0
      }
    });
    criados.push({ id: episodio.id, numero: episodio.numero, nome: episodio.nome });
  }

  return criados;
}
