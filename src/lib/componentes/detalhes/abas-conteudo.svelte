<!-- Arquivo: src/lib/componentes/detalhes/abas-conteudo.svelte -->
<!-- Abas "Episodios | Sobre | Personagens | Recomendacoes" com indicador deslizante.
     O indicador e um pseudo-elemento so (ver o CSS); o que a marcacao entrega sao as
     duas medidas da aba ativa. Medir e necessario porque os rotulos tem larguras bem
     diferentes — dividir a barra em partes iguais deixaria o traco torto embaixo de
     "Sobre" e sobrando embaixo de "Recomendacoes". -->
<script lang="ts">
  import './abas-conteudo.css';
  import { createEventDispatcher, onMount, tick } from 'svelte';

  export let abas: { chave: string; rotulo: string }[];
  export let ativa: string;

  const despachar = createEventDispatcher<{ trocar: string }>();

  const botoes: Record<string, HTMLButtonElement> = {};
  let deslocamento = 0;
  let largura = 0;

  function medir() {
    const alvo = botoes[ativa];
    if (!alvo) return;
    // offsetLeft e relativo a barra (ela e o offsetParent), entao ja vem no mesmo
    // sistema de coordenadas do conteudo rolado.
    deslocamento = alvo.offsetLeft;
    largura = alvo.offsetWidth;
  }

  function selecionar(chave: string) {
    ativa = chave;
    despachar('trocar', chave);
    void tick().then(() => {
      medir();
      // Em tela estreita a aba escolhida pode estar meio pra fora: puxa ela pra
      // dentro sem mexer na rolagem vertical da pagina.
      botoes[chave]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  }

  onMount(() => {
    medir();
    const aoRedimensionar = () => medir();
    window.addEventListener('resize', aoRedimensionar);
    // A fonte de titulo chega depois da primeira pintura e muda a largura do rotulo:
    // sem esta segunda medida o traco fica com a largura da fonte de sistema.
    void document.fonts?.ready.then(() => medir());
    return () => window.removeEventListener('resize', aoRedimensionar);
  });
</script>

<div
  class="abas rolagem-oculta"
  role="tablist"
  style:--aba-deslocamento={`${deslocamento}px`}
  style:--aba-largura={`${largura}px`}
>
  {#each abas as aba (aba.chave)}
    <button
      class="aba"
      class:aba-ativa={ativa === aba.chave}
      type="button"
      role="tab"
      aria-selected={ativa === aba.chave}
      bind:this={botoes[aba.chave]}
      on:click={() => selecionar(aba.chave)}
    >
      {aba.rotulo}
    </button>
  {/each}
</div>
