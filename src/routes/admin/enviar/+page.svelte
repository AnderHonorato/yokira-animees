<!-- Arquivo: src/routes/admin/enviar/+page.svelte -->
<!-- Envio avulso: serve pra trocar o video de um episodio que ja existe, sem passar
     pela tela do titulo. Duas origens pro mesmo destino — arquivo do computador ou
     link direto — e o radio escolhe qual campo fica de pe, pra ninguem preencher os
     dois e ficar em duvida sobre qual valeu.

     O caminho do ARQUIVO nao passa mais por action de formulario: ele entra na mesma
     fila da tela do titulo, entao a aba fica livre e da pra enfileirar um atras do
     outro sem esperar. O caminho do LINK continua sendo uma action, porque quem baixa
     e o servidor: nao ha bytes saindo daqui pra medir. -->
<script lang="ts">
  import '../admin.css';
  import '../tabela-admin.css';
  import '../admin-formularios.css';
  import '../../formulario-conta.css';
  import BotaoPill from '$componentes/comum/botao-pill.svelte';
  import Upload from '$visual/icones/upload.svelte';
  import SoltarVideo from '$componentes/admin/soltar-video.svelte';
  import { enfileirarEnvio } from '$cliente/fila-de-envio';
  import { avisar } from '$cliente/avisos';
  import { PAPEIS } from '$lib/validacoes/administracao';

  export let data;
  export let form;

  let origem: 'arquivo' | 'link' = 'arquivo';
  let episodioId = data.episodios[0]?.id ?? '';

  $: rotuloDoEpisodio =
    data.episodios.find((episodio) => episodio.id === episodioId)?.rotulo ?? 'Episódio';

  function enfileirar(arquivos: File[]) {
    if (!episodioId) return;
    for (const arquivo of arquivos) enfileirarEnvio(episodioId, rotuloDoEpisodio, arquivo);
    avisar('Envio na fila. Pode continuar usando o painel.', 'sucesso');
  }

  // A casca so oferece o que o papel alcanca; quem barra de verdade e o servidor.
  $: nivel = PAPEIS.indexOf(data.usuario.papel);
  $: podeModerar = nivel >= PAPEIS.indexOf('MODERADOR');
  $: podeGerirUsuarios = nivel >= PAPEIS.indexOf('ADMINISTRADOR');
</script>

<svelte:head><title>Enviar episódio — Yōkira Animes</title></svelte:head>

<header class="admin-cabecalho">
  <h1 class="admin-titulo">Enviar episódio</h1>
  <p class="admin-subtitulo">Formatos aceitos: mp4, mkv, mov e webm.</p>
</header>

<nav class="admin-nav" aria-label="Seções do painel">
  <div class="admin-nav-trilha">
    <a class="admin-nav-item" href="/admin">Início</a>
    <a class="admin-nav-item" href="/admin/titulos">Títulos</a>
    <a class="admin-nav-item admin-nav-item-ativa" aria-current="page" href="/admin/enviar">
      Enviar
    </a>
    {#if podeModerar}
      <a class="admin-nav-item" href="/admin/denuncias">Denúncias</a>
      <a class="admin-nav-item" href="/admin/registro">Registro</a>
    {/if}
    {#if podeGerirUsuarios}
      <a class="admin-nav-item" href="/admin/usuarios">Usuários</a>
    {/if}
  </div>
</nav>

<form class="conta-forma" method="POST">
  <label class="conta-campo">
    <span>Episódio</span>
    <select name="episodioId" bind:value={episodioId} required>
      {#each data.episodios as episodio (episodio.id)}
        <option value={episodio.id}>{episodio.rotulo}</option>
      {/each}
    </select>
  </label>

  <fieldset class="admin-origem">
    <legend>De onde vem o vídeo</legend>
    <label class="admin-origem-opcao">
      <input type="radio" name="origem" value="arquivo" bind:group={origem} />
      <span>Arquivo do computador</span>
    </label>
    <label class="admin-origem-opcao">
      <input type="radio" name="origem" value="link" bind:group={origem} />
      <span>Link direto</span>
    </label>
  </fieldset>

  {#if origem === 'arquivo'}
    <div class="conta-campo">
      <span>Arquivo de vídeo</span>
      <SoltarVideo
        destino={rotuloDoEpisodio}
        rotulo="Enviar vídeo deste episódio"
        on:arquivos={(evento) => enfileirar(evento.detail.arquivos)}
      />
      <small class="admin-dica">
        O envio começa na hora e aparece no painel do canto. Não precisa esperar aqui: a fila
        continua se você navegar pelo painel.
      </small>
    </div>
  {:else}
    <label class="conta-campo">
      <span>Link do vídeo</span>
      <input
        type="url"
        name="link"
        required
        placeholder="https://exemplo.com/episodio.mp4"
        inputmode="url"
      />
      <!-- O download acontece no servidor, entao o aviso importa: quem cola o link
           precisa saber que ele tem que ser publico e apontar pro arquivo em si. -->
      <small class="admin-dica">
        O servidor baixa o arquivo. Precisa ser um link público e direto para o vídeo, não uma
        página de player. Endereços de rede interna são recusados.
      </small>
    </label>
  {/if}

  {#if form?.mensagem}
    <p class="conta-erro" role="status">{form.mensagem}</p>
  {/if}

  <!-- O botao vale so pro link: no modo arquivo quem envia e a fila, e um "Enviar"
       ali embaixo sugeriria que ainda falta um passo. -->
  {#if origem === 'link'}
    <BotaoPill variante="marca" tipo="submit"><Upload tamanho={16} /> Enviar</BotaoPill>
  {/if}
</form>
