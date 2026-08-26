<!-- Arquivo: src/lib/componentes/home/banner-destaque.svelte -->
<!-- Hero: a arte cobre o painel inteiro e o texto fica por cima, sobre um veu que
     escurece de baixo pra cima. Antes a arte era um retrato pequeno a esquerda, o que
     desperdicava a maior peca da home. Troca sozinho a cada 7s e pausa no hover/foco. -->
<script lang="ts">
  import './banner-destaque-estilo.css';
  import './banner-destaque-sobreposto.css';
  import { onMount } from 'svelte';
  import BotaoPill from '../comum/botao-pill.svelte';
  import Chip from '../comum/chip.svelte';
  import Coroa from '$visual/icones/coroa.svelte';
  import Play from '$visual/icones/play.svelte';
  import Mais from '$visual/icones/mais.svelte';
  import PolegarCima from '$visual/icones/polegar-cima.svelte';
  import Verificado from '$visual/icones/verificado.svelte';
  import Girador from '../comum/girador.svelte';
  import { alternarLista, avaliar } from '$cliente/acoes-do-usuario';
  import { avisar, avisarErro } from '$cliente/avisos';
  import { criarRotacao, proximoIndice } from './banner-destaque';
  import type { DestaqueDoHero } from '$servidor/banco/tipos-catalogo';

  export let destaques: DestaqueDoHero[] = [];

  let indice = 0;
  $: atual = destaques[indice];

  const NOTA_DE_CURTIDA = 10;

  // O catalogo da home e publico e fica em cache compartilhado, entao ele nao pode
  // carregar estado de conta. O que a tela sabe vem da resposta do servidor no clique.
  let naLista: Record<string, boolean> = {};
  let curtido: Record<string, boolean> = {};
  let ocupado = '';

  async function aoAlternarLista() {
    ocupado = 'lista';
    try {
      const resultado = await alternarLista(atual.id);
      naLista = { ...naLista, [atual.id]: resultado.naLista };
      avisar(
        resultado.naLista
          ? `${atual.nome} entrou na sua lista.`
          : `${atual.nome} saiu da sua lista.`,
        resultado.naLista ? 'sucesso' : 'neutro'
      );
    } catch (erro) {
      avisarErro(erro, 'Não foi possível salvar na sua lista.');
    } finally {
      ocupado = '';
    }
  }

  async function aoCurtir() {
    ocupado = 'curtir';
    const jaCurtido = curtido[atual.id] === true;
    try {
      await avaliar(atual.id, jaCurtido ? null : NOTA_DE_CURTIDA);
      curtido = { ...curtido, [atual.id]: !jaCurtido };
      avisar(
        jaCurtido ? 'Curtida removida.' : 'Você curtiu este título.',
        jaCurtido ? 'neutro' : 'sucesso'
      );
    } catch (erro) {
      avisarErro(erro, 'Não foi possível registrar sua curtida.');
    } finally {
      ocupado = '';
    }
  }

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
      <img
        class="hero-arte"
        src={atual.arte}
        alt={`Arte de ${atual.nome}`}
        loading="eager"
        decoding="async"
      />
      <div class="hero-veu" aria-hidden="true"></div>

      {#if atual.novidade}
        <span class="hero-selo">Novo episódio</span>
      {/if}

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
          <BotaoPill
            variante={naLista[atual.id] ? 'sucesso' : 'neutro'}
            ativo={naLista[atual.id] === true}
            desabilitado={ocupado === 'lista'}
            on:click={aoAlternarLista}
          >
            {#if ocupado === 'lista'}
              <Girador />
            {:else if naLista[atual.id]}
              <Verificado tamanho={16} />
            {:else}
              <Mais tamanho={15} />
            {/if}
            {naLista[atual.id] ? 'Na Minha Lista' : 'Minha Lista'}
          </BotaoPill>

          <span class="hero-curtir" class:pill-curtido={curtido[atual.id]}>
            <BotaoPill
              variante="circular"
              ativo={curtido[atual.id] === true}
              desabilitado={ocupado === 'curtir'}
              rotuloAcessivel={curtido[atual.id] ? 'Remover curtida' : 'Curtir este título'}
              on:click={aoCurtir}
            >
              {#if ocupado === 'curtir'}<Girador />{:else}<PolegarCima tamanho={16} />{/if}
            </BotaoPill>
          </span>
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
