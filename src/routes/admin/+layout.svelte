<!-- Arquivo: src/routes/admin/+layout.svelte -->
<!-- Casca do painel. Existe por causa do painel de envios: a fila precisa sobreviver
     a navegacao entre as telas do admin. Se ele morasse numa pagina, sair de
     "Títulos" pra "Usuários" abortaria os uploads em voo. -->
<script lang="ts">
  import PainelDeEnvios from '$componentes/admin/painel-de-envios.svelte';
</script>

<slot />

<PainelDeEnvios />
