// Arquivo: src/lib/componentes/admin/estado-do-video.ts
// Acompanha a conversao dos episodios visiveis. Uma consulta para a temporada
// inteira, repetida enquanto houver algo andando — e SO enquanto houver: uma tela de
// titulo sem nada em conversao nao fica batendo no servidor a cada tres segundos.

import { browser } from '$app/environment';
import { writable, type Readable } from 'svelte/store';

export type SituacaoDoVideo = 'sem-video' | 'na-fila' | 'convertendo' | 'pronto' | 'falhou';

export interface EstadoDoVideo {
  situacao: SituacaoDoVideo;
  progresso: number;
  mensagem?: string;
}

const INTERVALO_MS = 3000;

/** Estados que ainda vao mudar sozinhos. So por eles vale voltar a perguntar. */
const EM_ANDAMENTO = new Set<SituacaoDoVideo>(['na-fila', 'convertendo']);

export interface AcompanhamentoDeVideo {
  estados: Readable<Record<string, EstadoDoVideo>>;
  /** Consulta agora. Chame depois de um envio terminar. */
  atualizar: () => Promise<void>;
  encerrar: () => void;
}

export function acompanharEpisodios(ids: () => string[]): AcompanhamentoDeVideo {
  const estados = writable<Record<string, EstadoDoVideo>>({});
  let relogio: ReturnType<typeof setTimeout> | undefined;
  let vivo = true;

  async function consultar() {
    try {
      const lista = ids() ?? [];
      if (lista.length === 0) return;

      const resposta = await fetch(`/api/admin/envio?episodios=${lista.join(',')}`);
      if (!resposta.ok) return;
      const corpo = (await resposta.json()) as { episodios: Record<string, EstadoDoVideo> };
      estados.set(corpo.episodios);

      // Reagenda so se algo ainda esta em movimento. Sem isso a tela aberta num
      // monitor a tarde inteira faria mil consultas por nada.
      const andando = Object.values(corpo.episodios).some((estado) =>
        EM_ANDAMENTO.has(estado.situacao)
      );
      if (vivo && andando) relogio = setTimeout(() => void consultar(), INTERVALO_MS);
    } catch {
      // Rede fora do ar nao e motivo pra derrubar a tela: a proxima chamada tenta.
    }
  }

  // So no navegador. Na renderizacao do servidor nao ha nada pra acompanhar — e uma
  // consulta ali derrubava o processo inteiro quando falhava, porque a promessa
  // rejeitada nao tinha quem a pegasse.
  if (browser) void consultar();

  return {
    estados: { subscribe: estados.subscribe },
    atualizar: async () => {
      if (!browser) return;
      clearTimeout(relogio);
      await consultar();
    },
    encerrar: () => {
      vivo = false;
      clearTimeout(relogio);
    }
  };
}
