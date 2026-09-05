<!-- Arquivo: src/lib/componentes/admin/painel-de-envios.svelte -->
<!-- Painel ancorado no rodape com a fila de envio. Mora no layout do painel, e nao
     numa pagina: assim ele atravessa a navegacao — da pra sair pra "Usuarios" e
     voltar sem derrubar o que esta subindo. So some quando a fila esvazia. -->
<script lang="ts">
  import './painel-de-envios.css';
  import {
    cancelarEnvio,
    envios,
    limparConcluidos,
    reenviar,
    resumoDosEnvios
  } from '$cliente/fila-de-envio';
  import Fechar from '$visual/icones/fechar.svelte';
  import Upload from '$visual/icones/upload.svelte';

  /** Recolhido guarda o espaco da tela sem parar nada: os envios continuam. */
  let recolhido = false;

  const ROTULO: Record<string, string> = {
    'na-fila': 'Na fila',
    enviando: 'Enviando',
    concluido: 'Enviado',
    falhou: 'Falhou',
    cancelado: 'Cancelado'
  };

  function emMegabytes(bytes: number): string {
    if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
    return `${Math.max(1, Math.round(bytes / 1024 ** 2))} MB`;
  }

  function porcentagem(enviados: number, bytes: number): number {
    return bytes === 0 ? 0 : Math.min(100, Math.round((enviados / bytes) * 100));
  }
</script>

{#if $envios.length > 0}
  <aside class="envios" class:envios-recolhido={recolhido} aria-label="Fila de envio">
    <header class="envios-topo">
      <button
        class="envios-resumo"
        type="button"
        aria-expanded={!recolhido}
        on:click={() => (recolhido = !recolhido)}
      >
        <Upload tamanho={16} />
        <span class="envios-titulo">
          {#if $resumoDosEnvios.ativos > 0}
            Enviando {$resumoDosEnvios.ativos} de {$resumoDosEnvios.total}
          {:else if $resumoDosEnvios.falhados > 0}
            {$resumoDosEnvios.falhados} envio(s) com falha
          {:else}
            {$resumoDosEnvios.concluidos} envio(s) concluído(s)
          {/if}
        </span>
        {#if $resumoDosEnvios.ativos > 0}
          <!-- Porcentagem por BYTES: com dez arquivos pequenos e um enorme, contar
               por quantidade mostraria 90% com quase tudo por subir. -->
          <span class="envios-porcentagem">{$resumoDosEnvios.porcentagem}%</span>
        {/if}
      </button>

      {#if $resumoDosEnvios.ativos === 0}
        <button class="envios-limpar" type="button" on:click={limparConcluidos}>
          Limpar
          <Fechar tamanho={14} />
        </button>
      {/if}
    </header>

    {#if $resumoDosEnvios.ativos > 0}
      <div class="envios-barra" aria-hidden="true">
        <span class="envios-barra-feita" style:width={`${$resumoDosEnvios.porcentagem}%`}></span>
      </div>
    {/if}

    <ul class="envios-lista">
      {#each $envios as envio (envio.id)}
        <li class="envios-item" data-situacao={envio.situacao}>
          <span class="envios-item-texto">
            <strong class="envios-item-destino">{envio.destino}</strong>
            <span class="envios-item-meta">
              {ROTULO[envio.situacao]} · {emMegabytes(envio.bytes)}
              {#if envio.situacao === 'enviando'}
                · {porcentagem(envio.enviados, envio.bytes)}%
              {/if}
            </span>
            {#if envio.erro}
              <span class="envios-item-erro">{envio.erro}</span>
            {/if}
          </span>

          {#if envio.situacao === 'enviando' || envio.situacao === 'na-fila'}
            <span class="envios-item-progresso" aria-hidden="true">
              <span
                class="envios-item-progresso-feito"
                style:width={`${porcentagem(envio.enviados, envio.bytes)}%`}
              ></span>
            </span>
            <button class="envios-item-acao" type="button" on:click={() => cancelarEnvio(envio.id)}>
              Cancelar
            </button>
          {:else if envio.situacao === 'falhou'}
            <button class="envios-item-acao" type="button" on:click={() => reenviar(envio.id)}>
              Reenviar
            </button>
          {/if}
        </li>
      {/each}
    </ul>
  </aside>
{/if}
