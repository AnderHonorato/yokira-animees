<!-- Arquivo: src/lib/componentes/admin/criar-episodios-em-lote.svelte -->
<!-- Cadastro de temporada inteira de uma vez. Antes, uma temporada de 12 episodios
     custava 26 envios de formulario em tres paginas: criar cada episodio e depois ir
     ao /admin/enviar escolher cada um num select. -->
<script lang="ts">
  import './criar-episodios-em-lote.css';
  import { enhance } from '$app/forms';
  import { createEventDispatcher } from 'svelte';
  import BotaoPill from '$componentes/comum/botao-pill.svelte';

  export let temporadaId: string;
  /** Continua a numeracao de onde a temporada parou. */
  export let proximoNumero = 1;

  const despachar = createEventDispatcher<{
    enviarArquivos: { temporadaId: string; numeroInicial: number; arquivos: File[] };
  }>();

  let modo: 'quantidade' | 'links' | 'arquivos' = 'quantidade';
  let agendar = false;
  let numeroInicial = proximoNumero;
  let campoArquivos: HTMLInputElement;
  let pendentes: File[] = [];
</script>

<!--
  No modo "arquivos" os BYTES nao vao neste POST. O formulario cria so o cadastro —
  que e rapido e precisa ficar de pe mesmo se a rede cair — e os videos sobem depois
  pela fila do navegador, um a um, com progresso proprio. Antes era tudo num envio
  unico: a aba ficava presa ate o ultimo byte do ultimo arquivo, e uma queda no meio
  nao deixava nem os episodios criados.
-->
<form
  class="lote"
  method="POST"
  action="?/criarEpisodiosEmLote"
  enctype="multipart/form-data"
  use:enhance={({ formData, cancel }) => {
    if (modo === 'arquivos') {
      const escolhidos = Array.from(campoArquivos?.files ?? []);
      if (escolhidos.length === 0) {
        cancel();
        return;
      }
      formData.delete('arquivos');
      formData.set('quantidade', String(escolhidos.length));
      pendentes = escolhidos;
    }

    return async ({ result, update }) => {
      await update();
      if (result.type === 'success' && pendentes.length > 0) {
        despachar('enviarArquivos', { temporadaId, numeroInicial, arquivos: pendentes });
        pendentes = [];
        if (campoArquivos) campoArquivos.value = '';
      }
    };
  }}
>
  <h4 class="lote-titulo">Adicionar vários episódios</h4>
  <input type="hidden" name="temporadaId" value={temporadaId} />

  <div class="lote-modos">
    <label class="lote-modo">
      <input type="radio" value="quantidade" bind:group={modo} />
      <span>Quantidade</span>
    </label>
    <label class="lote-modo">
      <input type="radio" value="links" bind:group={modo} />
      <span>Lista de links</span>
    </label>
    <label class="lote-modo">
      <input type="radio" value="arquivos" bind:group={modo} />
      <span>Vários arquivos</span>
    </label>
  </div>

  <div class="lote-linha">
    <label class="lote-campo lote-campo-curto">
      <span>Começar no episódio</span>
      <input type="number" name="numeroInicial" min="1" bind:value={numeroInicial} required />
    </label>

    {#if modo === 'quantidade'}
      <label class="lote-campo lote-campo-curto">
        <span>Quantos</span>
        <input type="number" name="quantidade" min="1" max="200" value="12" required />
      </label>
    {/if}
  </div>

  {#if modo === 'links'}
    <label class="lote-campo">
      <span>Um link por linha</span>
      <textarea name="links" rows="6" placeholder="https://exemplo.com/ep-01.mp4" required
      ></textarea>
      <small class="lote-dica">
        Cada linha vira um episódio, na ordem. O servidor baixa e converte cada um; links de rede
        interna são recusados.
      </small>
    </label>
  {:else if modo === 'arquivos'}
    <label class="lote-campo">
      <span>Arquivos de vídeo</span>
      <input
        bind:this={campoArquivos}
        type="file"
        name="arquivos"
        accept="video/*"
        multiple
        required
      />
      <small class="lote-dica">
        Um episódio por arquivo, na ordem em que aparecem. Os episódios são criados na hora e os
        vídeos entram na fila de envio — dá para sair desta tela sem parar nada.
      </small>
    </label>
  {/if}

  <label class="lote-modo">
    <input type="checkbox" bind:checked={agendar} />
    <span>Agendar as estreias</span>
  </label>

  {#if agendar}
    <div class="lote-linha">
      <label class="lote-campo">
        <span>Estreia do primeiro</span>
        <input type="datetime-local" name="estreia" required />
      </label>
      <label class="lote-campo lote-campo-curto">
        <span>Depois disso</span>
        <select name="intervalo">
          <option value="semanal">Um por semana</option>
          <option value="diario">Um por dia</option>
          <option value="nenhum">Todos juntos</option>
        </select>
      </label>
    </div>
    <small class="lote-dica">
      Simulcast: só o primeiro fica no ar hoje, e os outros aparecem sozinhos na data.
    </small>
  {/if}

  <BotaoPill variante="marca" tipo="submit">Criar episódios</BotaoPill>
</form>
