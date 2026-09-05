<!-- Arquivo: src/lib/componentes/admin/soltar-video.svelte -->
<!-- Alvo de envio de um episodio: arrastar o arquivo em cima ou clicar pra escolher.
     Nao envia nada sozinho — so entrega o File pra fila, que cuida do resto. Por isso
     a tela nunca trava aqui: soltar doze arquivos e doze chamadas de funcao. -->
<script lang="ts">
  import './soltar-video.css';
  import { createEventDispatcher } from 'svelte';
  import Upload from '$visual/icones/upload.svelte';

  /** Rotulo do alvo, usado no painel da fila ("T1 EP3 — Nome"). */
  export let destino: string;
  export let rotulo = 'Enviar vídeo';
  /** Varios arquivos de uma vez: a temporada aceita, um episodio nao. */
  export let multiplo = false;
  export let compacto = false;

  const despachar = createEventDispatcher<{ arquivos: { arquivos: File[] } }>();

  let arrastando = false;
  let campo: HTMLInputElement;

  function entregar(lista: FileList | null) {
    const arquivos = Array.from(lista ?? []);
    if (arquivos.length > 0) despachar('arquivos', { arquivos });
    // Zera o campo: sem isso, escolher o MESMO arquivo de novo (depois de uma falha)
    // nao dispara evento nenhum, porque o valor do input nao mudou.
    if (campo) campo.value = '';
  }

  function aoSoltar(evento: DragEvent) {
    evento.preventDefault();
    arrastando = false;
    entregar(evento.dataTransfer?.files ?? null);
  }
</script>

<div
  class="soltar"
  class:soltar-ativo={arrastando}
  class:soltar-compacto={compacto}
  role="presentation"
  on:dragover|preventDefault={() => (arrastando = true)}
  on:dragleave={() => (arrastando = false)}
  on:drop={aoSoltar}
>
  <label class="soltar-alvo">
    <Upload tamanho={compacto ? 14 : 18} />
    <span class="soltar-texto">
      {rotulo}
      {#if !compacto}
        <small class="soltar-dica">Arraste o arquivo aqui ou clique para escolher</small>
      {/if}
    </span>
    <input
      bind:this={campo}
      class="apenas-leitor-de-tela"
      type="file"
      accept="video/mp4,video/x-matroska,video/quicktime,video/webm,.mp4,.mkv,.mov,.webm"
      multiple={multiplo}
      aria-label={`${rotulo} — ${destino}`}
      on:change={(evento) => entregar(evento.currentTarget.files)}
    />
  </label>
</div>
