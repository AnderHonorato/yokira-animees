<!-- Arquivo: src/routes/admin/registro/+page.svelte -->
<script lang="ts">
  import '../admin.css';
  import '../tabela-admin.css';
  import '../admin-formularios.css';
  import '../admin-tabela.css';
  import { PAPEIS } from '$lib/validacoes/administracao';

  export let data;

  const formatador = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });

  // A casca so oferece o que o papel alcanca; quem barra de verdade e o servidor.
  $: nivel = PAPEIS.indexOf(data.usuario.papel);
  $: podeModerar = nivel >= PAPEIS.indexOf('MODERADOR');
  $: podeGerirUsuarios = nivel >= PAPEIS.indexOf('ADMINISTRADOR');
</script>

<svelte:head><title>Registro — Painel Yōkira</title></svelte:head>

<header class="admin-cabecalho">
  <h1 class="admin-titulo">Registro administrativo</h1>
  <p class="admin-subtitulo">As 100 ações mais recentes, da mais nova para a mais antiga.</p>
</header>

<nav class="admin-nav" aria-label="Seções do painel">
  <div class="admin-nav-trilha">
    <a class="admin-nav-item" href="/admin">Início</a>
    <a class="admin-nav-item" href="/admin/titulos">Títulos</a>
    <a class="admin-nav-item" href="/admin/enviar">Enviar</a>
    {#if podeModerar}
      <a class="admin-nav-item" href="/admin/denuncias">Denúncias</a>
      <a class="admin-nav-item admin-nav-item-ativa" aria-current="page" href="/admin/registro">
        Registro
      </a>
    {/if}
    {#if podeGerirUsuarios}
      <a class="admin-nav-item" href="/admin/usuarios">Usuários</a>
    {/if}
  </div>
</nav>

<section class="admin-secao">
  {#if data.registros.length === 0}
    <p class="admin-secao-texto">Nada registrado ainda.</p>
  {:else}
    <ul class="admin-tabela">
      {#each data.registros as registro (registro.id)}
        <li class="admin-linha">
          <span class="admin-linha-principal">
            <strong>{registro.acao}</strong>
            <span class="admin-linha-meta">
              {registro.usuario?.email ?? 'conta removida'}
              {#if registro.alvo}
                · alvo {registro.alvo}{/if}
              {#if registro.detalhe}
                · {registro.detalhe}{/if}
            </span>
          </span>
          <span class="admin-linha-meta">{formatador.format(new Date(registro.criadoEm))}</span>
        </li>
      {/each}
    </ul>
  {/if}
</section>
