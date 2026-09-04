<!-- Arquivo: src/lib/componentes/carregando/esqueleto-trilha.svelte -->
<!-- Uma trilha da home enquanto carrega: titulo e a fila de cards saindo pela borda. -->
<script lang="ts">
  import './esqueleto-trilha.css';
  import Esqueleto from '../comum/esqueleto.svelte';
  import EsqueletoCartao from './esqueleto-cartao.svelte';
  import { repetir } from './esqueleto-de-rota';

  /** Cards fingidos. O excedente sai pela borda, como na trilha de verdade. */
  export let cartoes = 6;
</script>

<section class="esqueleto-trilha">
  <div class="esqueleto-trilha-topo">
    <div class="esqueleto-trilha-traco"><Esqueleto raio="var(--raio-botao)" /></div>
    <div class="esqueleto-trilha-titulo"><Esqueleto raio="var(--raio-botao)" /></div>
  </div>
  <ul class="esqueleto-trilha-fila">
    {#each repetir(cartoes) as indice (indice)}
      <EsqueletoCartao />
    {/each}
  </ul>
</section>
