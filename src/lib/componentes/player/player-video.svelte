<!-- Arquivo: src/lib/componentes/player/player-video.svelte -->
<!-- Player HLS. Controles nativos de proposito: acessibilidade e tela cheia de graca,
     e o esforco de UI vai pro que as telas de referencia realmente pedem. -->
<script lang="ts">
  import './player-video.css';
  import { onDestroy, onMount } from 'svelte';
  import { anexarPlaylist } from './carregar-hls';
  import { criarAgendador } from './progresso-periodico';
  import { obterChaveDeAudiencia } from './chave-de-audiencia';
  import { salvarProgressoNoServidor, sinalizarAudiencia } from '$cliente/acoes-do-usuario';
  import OlhoAssistindo from '$visual/icones/olho-assistindo.svelte';

  export let episodioId: string;
  export let playlist: string | null = null;
  export let segundoInicial = 0;

  let video: HTMLVideoElement;
  let assistindo = 0;
  let desanexar: (() => void) | undefined;
  let sinalizador: ReturnType<typeof setInterval> | undefined;

  const agendador = criarAgendador((segundos) => {
    void salvarProgressoNoServidor(episodioId, segundos).catch(() => undefined);
  });

  async function pulsarAudiencia() {
    const resultado = await sinalizarAudiencia(episodioId, obterChaveDeAudiencia()).catch(
      () => null
    );
    if (resultado) assistindo = resultado.assistindo;
  }

  // Uma gravacao final quando a aba fecha: o onDestroy nao roda em fechamento de aba.
  const aoSair = () => agendador.encerrar();

  onMount(() => {
    window.addEventListener('beforeunload', aoSair);

    void (async () => {
      if (playlist) desanexar = await anexarPlaylist(video, playlist);
      if (segundoInicial > 0) video.currentTime = segundoInicial;
      await pulsarAudiencia();
      sinalizador = setInterval(pulsarAudiencia, 30_000);
    })();
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') window.removeEventListener('beforeunload', aoSair);
    clearInterval(sinalizador);
    desanexar?.();
    agendador.encerrar();
  });
</script>

<div class="player">
  {#if playlist}
    <video
      class="player-video"
      bind:this={video}
      controls
      playsinline
      preload="metadata"
      on:timeupdate={() => agendador.aoAtualizarTempo(video.currentTime)}
      on:pause={() => agendador.gravarAgora(video.currentTime)}
    >
      <track kind="captions" label="Sem legenda cadastrada" />
    </video>
  {:else}
    <div class="player-vazio">
      <p>Este episódio ainda não tem vídeo processado.</p>
      <p class="player-vazio-dica">Envie o arquivo pelo painel administrativo para gerar o HLS.</p>
    </div>
  {/if}

  <p class="player-audiencia">
    <span class="player-ponto" aria-hidden="true"></span>
    <OlhoAssistindo tamanho={14} />
    {assistindo} assistindo agora
  </p>
</div>
