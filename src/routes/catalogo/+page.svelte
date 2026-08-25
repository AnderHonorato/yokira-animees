<!-- Arquivo: src/routes/catalogo/+page.svelte -->
<!-- Catalogo em grade. Mesmo card das trilhas pra manter a leitura visual identica. -->
<script lang="ts">
  import '../grade-titulos.css';
  import CartaoConteudo from '$componentes/home/cartao-conteudo.svelte';
  import Chip from '$componentes/comum/chip.svelte';

  export let data;
</script>

<svelte:head><title>Catálogo — Yōkira Animes</title></svelte:head>

<h1 class="pagina-titulo">Catálogo</h1>

<nav class="filtros rolagem-oculta" aria-label="Filtrar por gênero">
  <a class="filtro" class:filtro-ativo={!data.generoAtivo} href="/catalogo">Todos</a>
  {#each data.generos as genero (genero.id)}
    <a
      class="filtro"
      class:filtro-ativo={data.generoAtivo === genero.slug}
      href={`/catalogo?genero=${genero.slug}`}
    >
      {genero.nome}
    </a>
  {/each}
</nav>

{#if data.itens.length === 0}
  <p class="grade-vazia">Nenhum título neste gênero ainda.</p>
{:else}
  <ul class="grade-titulos">
    {#each data.itens as item (item.id)}
      <CartaoConteudo {item} />
    {/each}
  </ul>
  <p class="grade-rodape"><Chip variante="neutro">{data.itens.length} títulos</Chip></p>
{/if}
