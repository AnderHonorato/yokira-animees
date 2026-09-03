<!-- Arquivo: src/lib/componentes/comum/botao-pill.svelte -->
<!-- Botao arredondado do hero ("Assistir agora", "+ Minha Lista"). Vira <a> quando recebe href. -->
<script lang="ts">
  import './botao-pill.css';

  /* "fantasma" e a acao de apoio: sem fundo nem borda, pra nao competir com o
     primario que estiver do lado. */
  export let variante: 'marca' | 'neutro' | 'circular' | 'sucesso' | 'fantasma' = 'marca';
  /** Estado ligado (na lista, curtido). Dispara a animacao de confirmacao. */
  export let ativo = false;
  export let href: string | undefined = undefined;
  export let tipo: 'button' | 'submit' = 'button';
  export let desabilitado = false;
  export let rotuloAcessivel: string | undefined = undefined;
</script>

{#if href}
  <a class="pill pill-{variante}" class:pill-ativo={ativo} {href} aria-label={rotuloAcessivel}>
    <slot />
  </a>
{:else}
  <button
    class="pill pill-{variante}"
    class:pill-ativo={ativo}
    type={tipo}
    disabled={desabilitado}
    aria-pressed={ativo ? true : undefined}
    aria-label={rotuloAcessivel}
    on:click
  >
    <slot />
  </button>
{/if}
