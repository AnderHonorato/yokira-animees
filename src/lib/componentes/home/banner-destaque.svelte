<!-- Arquivo: src/lib/componentes/home/banner-destaque.svelte -->
<!-- Hero das tres telas: arte a esquerda, titulo/coroa/meta/sinopse/botoes a direita e
     os cinco dots embaixo. Troca sozinho a cada 7s e pausa no hover/foco. -->
<script lang="ts">
  import './banner-destaque-estilo.css';
  import { onMount } from 'svelte';
  import RecorteHero from '$visual/molduras/recorte-hero.svelte';
  import BotaoPill from '../comum/botao-pill.svelte';
  import Chip from '../comum/chip.svelte';
  import Coroa from '$visual/icones/coroa.svelte';
  import Play from '$visual/icones/play.svelte';
  import Mais from '$visual/icones/mais.svelte';
  import PolegarCima from '$visual/icones/polegar-cima.svelte';
  import { criarRotacao, proximoIndice } from './banner-destaque';
  import type { DestaqueDoHero } from '$servidor/banco/tipos-catalogo';

  export let destaques: DestaqueDoHero[] = [];

  let indice = 0;
  $: atual = destaques[indice];

  const rotacao = criarRotacao(() => {
    indice = proximoIndice(indice, destaques.length);
  });

  onMount(() => {
    rotacao.iniciar();
    return rotacao.parar;
  });
</script>

{#if atual}
  <section
    class="hero"
    aria-label="Destaque do catálogo"
    on:mouseenter={rotacao.parar}
    on:mouseleave={rotacao.iniciar}
    on:focusin={rotacao.parar}
    on:focusout={rotacao.iniciar}
  >
    <div class="hero-painel">
      <div class="hero-arte">
        <RecorteHero fonte={atual.arte} descricao={`Arte de ${atual.nome}`}>
          {#if atual.novidade}
            <span class="hero-selo">Novo episódio</span>
          {/if}
        </RecorteHero>
      </div>

      <div class="hero-texto">
        <h1 class="hero-titulo">{atual.nome}</h1>

        <p class="hero-gratuito">
          <span class="hero-coroa"><Coroa tamanho={16} /></span>
          {atual.chamadaGratuita}
        </p>

        <p class="hero-meta">
          <Chip variante="classificacao">{atual.classificacao}</Chip>
          <span>{atual.ano}</span>
          <span aria-hidden="true">•</span>
          <span>{atual.temporadas} {atual.temporadas === 1 ? 'Temporada' : 'Temporadas'}</span>
          <span aria-hidden="true">•</span>
          <span>{atual.generos.join(', ')}</span>
        </p>

        <p class="hero-sinopse">{atual.sinopse}</p>

        <div class="hero-acoes">
          <BotaoPill variante="marca" href={`/titulo/${atual.slug}`}>
            <Play tamanho={15} /> Assistir agora
          </BotaoPill>
          <BotaoPill variante="neutro" href={`/titulo/${atual.slug}`}>
            <Mais tamanho={15} /> Minha Lista
          </BotaoPill>
          <BotaoPill variante="circular" rotuloAcessivel="Curtir este título">
            <PolegarCima tamanho={16} />
          </BotaoPill>
        </div>
      </div>
    </div>

    <div class="hero-dots" role="tablist" aria-label="Trocar destaque">
      {#each destaques as destaque, posicao (destaque.id)}
        <button
          class="hero-dot"
          class:hero-dot-ativo={posicao === indice}
          type="button"
          role="tab"
          aria-selected={posicao === indice}
          aria-label={`Ver ${destaque.nome}`}
          on:click={() => (indice = posicao)}
        ></button>
      {/each}
    </div>
  </section>
{/if}
