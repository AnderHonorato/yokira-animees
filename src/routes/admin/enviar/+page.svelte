<!-- Arquivo: src/routes/admin/enviar/+page.svelte -->
<script lang="ts">
  import '../admin.css';
  import '../../formulario-conta.css';
  import BotaoPill from '$componentes/comum/botao-pill.svelte';
  import Upload from '$visual/icones/upload.svelte';

  export let data;
  export let form;
</script>

<svelte:head><title>Enviar episódio — Yōkira Animes</title></svelte:head>

<h1 class="admin-titulo">Enviar episódio</h1>
<p class="admin-subtitulo">Formatos aceitos: mp4, mkv, mov e webm.</p>

<form class="conta-forma" method="POST" enctype="multipart/form-data">
  <label class="conta-campo">
    <span>Episódio</span>
    <select name="episodioId" required>
      {#each data.episodios as episodio (episodio.id)}
        <option value={episodio.id}>{episodio.rotulo}</option>
      {/each}
    </select>
  </label>

  <label class="conta-campo">
    <span>Arquivo de vídeo</span>
    <input type="file" name="arquivo" accept="video/*" required />
  </label>

  {#if form?.mensagem}
    <p class="conta-erro" role="status">{form.mensagem}</p>
  {/if}

  <BotaoPill variante="marca" tipo="submit"><Upload tamanho={16} /> Enviar</BotaoPill>
</form>
