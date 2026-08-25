<!-- Arquivo: src/lib/componentes/comum/botao-pill.svelte -->
<!-- Botao arredondado do hero ("Assistir agora", "+ Minha Lista"). Vira <a> quando recebe href. -->
<script lang="ts">
  import './botao-pill.css';

  export let variante: 'marca' | 'neutro' | 'circular' = 'marca';
  export let href: string | undefined = undefined;
  export let tipo: 'button' | 'submit' = 'button';
  export let desabilitado = false;
  export let rotuloAcessivel: string | undefined = undefined;
</script>

{#if href}
  <a class="pill pill-{variante}" {href} aria-label={rotuloAcessivel}>
    <slot />
  </a>
{:else}
  <button
    class="pill pill-{variante}"
    type={tipo}
    disabled={desabilitado}
    aria-label={rotuloAcessivel}
    on:click
  >
    <slot />
  </button>
{/if}
