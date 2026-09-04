<!-- Arquivo: src/lib/componentes/carregando/esqueleto-player.svelte -->
<!-- Tela de assistir: o quadro do video e a ficha do episodio embaixo. -->
<script lang="ts">
  import './esqueleto-player.css';
  import Esqueleto from '../comum/esqueleto.svelte';
  import { repetir } from './esqueleto-de-rota';
</script>

<div class="esqueleto-player">
  <div class="esqueleto-player-voltar"><Esqueleto raio="var(--raio-botao)" /></div>
  <!-- O raio mora no invólucro, que recorta: no celular ele e zero (video sangrado). -->
  <div class="esqueleto-player-quadro"><Esqueleto raio="0" /></div>
  <div class="esqueleto-player-nome"><Esqueleto raio="var(--raio-botao)" /></div>
  <div class="esqueleto-player-meta"><Esqueleto raio="var(--raio-botao)" /></div>

  <div class="esqueleto-player-acoes">
    {#each repetir(3) as indice (indice)}
      <div class="esqueleto-player-acao"><Esqueleto raio="var(--raio-botao)" /></div>
    {/each}
  </div>
</div>
