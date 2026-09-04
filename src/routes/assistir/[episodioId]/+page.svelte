<!-- Arquivo: src/routes/assistir/[episodioId]/+page.svelte -->
<script lang="ts">
  import './assistir.css';
  import PlayerVideo from '$componentes/player/player-video.svelte';
  import SetaEsquerda from '$visual/icones/seta-esquerda.svelte';
  import Chip from '$componentes/comum/chip.svelte';
  import ItemEpisodio from '$componentes/detalhes/item-episodio.svelte';

  export let data;
</script>

<svelte:head><title>{data.titulo.nome} — EP {data.episodio.numero}</title></svelte:head>

<div class="assistir">
  <a class="assistir-voltar" href={`/titulo/${data.titulo.slug}`}>
    <SetaEsquerda tamanho={16} />
    {data.titulo.nome}
  </a>

  <PlayerVideo
    episodioId={data.episodio.id}
    temMidia={data.temMidia}
    segundoInicial={data.segundoInicial}
  />

  <h1 class="assistir-titulo">
    T{data.temporada} · {data.episodio.numero}. {data.episodio.nome}
  </h1>

  <p class="assistir-meta">
    <span>{data.episodio.duracaoMinutos}min</span>
    <Chip>Legendas Br</Chip>
    <Chip variante="neutro">PT</Chip>
  </p>

  <!-- O que assistir em seguida. A lista reusa o mesmo item da pagina de detalhes,
       entao miniatura, numeracao e download se comportam igual nos dois lugares. -->
  {#if data.seguintes.length > 0}
    <section class="assistir-proximos">
      <h2 class="assistir-proximos-titulo">Próximos episódios</h2>
      <ul class="assistir-proximos-lista">
        {#each data.seguintes as episodio (episodio.id)}
          <ItemEpisodio {episodio} />
        {/each}
      </ul>
    </section>
  {/if}
</div>
