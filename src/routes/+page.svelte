<!-- Arquivo: src/routes/+page.svelte -->
<!-- Home: hero rotativo + trilhas Populares / Em alta / Novidades (imagens 1 e 2). -->
<script lang="ts">
  import BannerDestaque from '$componentes/home/banner-destaque.svelte';
  import TrilhaConteudo from '$componentes/home/trilha-conteudo.svelte';

  export let data;
</script>

<svelte:head>
  <title>Yōkira Animes — Início</title>
  <meta
    name="description"
    content="Catálogo de animes com legendas em português no Yōkira Animes."
  />
</svelte:head>

<BannerDestaque destaques={data.catalogo.destaques} />

{#each data.catalogo.trilhas as trilha, indice (trilha.chave)}
  <TrilhaConteudo {trilha} prioritaria={indice === 0} />
{/each}
