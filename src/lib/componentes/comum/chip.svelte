<!-- Arquivo: src/lib/componentes/comum/chip.svelte -->
<!-- Chip pequeno: "Legendas Br", "PT", classificacao "16", "Falhou na conversão".
     Quatro variantes, um componente. -->
<script lang="ts">
  import './chip.css';

  export let variante: 'roxo' | 'neutro' | 'classificacao' | 'erro' = 'roxo';
</script>

<span class="chip chip-{variante}"><slot /></span>
