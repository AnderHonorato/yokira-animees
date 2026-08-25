<!-- Arquivo: src/routes/+layout.svelte -->
<!-- Casca de todas as paginas. O prefetch fica em "hover" no desktop e "tap" no mobile:
     no toque, "hover" nao existe e a rota so comecaria a carregar depois do clique. -->
<script lang="ts">
  import '$lib/estilos/tema.css';
  import '$lib/estilos/base.css';
  import '$lib/estilos/animacoes.css';
  import './layout.css';

  import { onMount } from 'svelte';
  import Cabecalho from '$componentes/casca/cabecalho.svelte';
  import BarraInferior from '$componentes/casca/barra-inferior.svelte';
  import Rodape from '$componentes/casca/rodape.svelte';
  import FaixaOffline from '$componentes/casca/faixa-offline.svelte';
  import TelaDeCarregamento from '$componentes/casca/tela-de-carregamento.svelte';
  import { registrarServiceWorker } from '$cliente/registrar-service-worker';
  import { estrategiaDePrefetch } from '$cliente/navegacao-instantanea';

  export let data;

  let prefetch: 'hover' | 'tap' = 'hover';

  onMount(() => {
    prefetch = estrategiaDePrefetch();
    void registrarServiceWorker();
  });
</script>

<TelaDeCarregamento />
<FaixaOffline />

<div class="casca" data-sveltekit-preload-data={prefetch}>
  <Cabecalho usuario={data.usuario} />

  <main class="casca-conteudo">
    <slot />
  </main>

  <Rodape />
  <BarraInferior />
</div>
