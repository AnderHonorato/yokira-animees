<!-- Arquivo: src/lib/visual/molduras/recorte-hero.svelte -->
<!-- Arte do hero com o degrade que funde a imagem no painel, igual as telas de referencia. -->
<script lang="ts">
  import './recorte-hero.css';

  export let fonte: string;
  export let descricao: string;
</script>

<div class="recorte-hero">
  <img
    class="recorte-hero-imagem"
    src={fonte}
    alt={descricao}
    fetchpriority="high"
    decoding="async"
  />
  <div class="recorte-hero-veu" aria-hidden="true"></div>
  <slot />
</div>
