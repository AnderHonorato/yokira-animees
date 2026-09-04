<!-- Arquivo: src/routes/admin/usuarios/+page.svelte -->
<!-- Trocar papel e remover conta. As duas passam pela dupla confirmacao: promover
     alguem a ADMINISTRADOR e tao irreversivel na pratica quanto apagar. -->
<script lang="ts">
  import '../admin.css';
  import '../tabela-admin.css';
  import '../admin-formularios.css';
  import '../admin-tabela.css';
  import { invalidateAll } from '$app/navigation';
  import BotaoPill from '$componentes/comum/botao-pill.svelte';
  import Chip from '$componentes/comum/chip.svelte';
  import DialogoConfirmacao from '$componentes/comum/dialogo-confirmacao.svelte';
  import { executarAcaoAdministrativa } from '$cliente/acoes-administrativas';
  import { avisar, avisarErro } from '$cliente/avisos';
  import { PAPEIS } from '$lib/validacoes/administracao';
  import SetaBaixo from '$visual/icones/seta-baixo.svelte';

  // A casca so oferece o que o papel alcanca; quem barra de verdade e o servidor.
  $: nivel = PAPEIS.indexOf(data.usuario.papel);
  $: podeModerar = nivel >= PAPEIS.indexOf('MODERADOR');
  $: podeGerirUsuarios = nivel >= PAPEIS.indexOf('ADMINISTRADOR');

  export let data;

  interface AcaoPendente {
    acao: string;
    alvo: string;
    titulo: string;
    descricao: string;
    aviso: string;
    palavraChave?: string;
    extras?: Record<string, string>;
  }

  let pendente: AcaoPendente | null = null;
  let processando = false;

  async function confirmar() {
    if (!pendente) return;
    processando = true;
    try {
      await executarAcaoAdministrativa(pendente.acao, pendente.alvo, pendente.extras ?? {});
      avisar(`${pendente.titulo}: concluído.`, 'sucesso');
      pendente = null;
      await invalidateAll();
    } catch (erro) {
      avisarErro(erro);
    } finally {
      processando = false;
    }
  }

  function pedirTrocaDePapel(usuario: { id: string; nome: string; papel: string }, papel: string) {
    if (papel === usuario.papel) return;
    pendente = {
      acao: 'trocar-papel',
      alvo: usuario.id,
      extras: { papel },
      titulo: `Mudar ${usuario.nome} para ${papel}`,
      descricao: `A conta passa de ${usuario.papel} para ${papel} imediatamente.`,
      aviso:
        papel === 'ADMINISTRADOR'
          ? 'Administrador pode mexer em qualquer conta, inclusive na sua.'
          : 'A pessoa perde acesso às áreas do papel anterior.'
    };
  }
</script>

<svelte:head><title>Usuários — Painel Yōkira</title></svelte:head>

<header class="admin-cabecalho">
  <h1 class="admin-titulo">Usuários</h1>
  <p class="admin-subtitulo">Contas, papéis e remoção. Toda troca passa pela dupla confirmação.</p>
</header>

<nav class="admin-nav" aria-label="Seções do painel">
  <div class="admin-nav-trilha">
    <a class="admin-nav-item" href="/admin">Início</a>
    <a class="admin-nav-item" href="/admin/titulos">Títulos</a>
    <a class="admin-nav-item" href="/admin/enviar">Enviar</a>
    {#if podeModerar}
      <a class="admin-nav-item" href="/admin/denuncias">Denúncias</a>
      <a class="admin-nav-item" href="/admin/registro">Registro</a>
    {/if}
    {#if podeGerirUsuarios}
      <a class="admin-nav-item admin-nav-item-ativa" aria-current="page" href="/admin/usuarios">
        Usuários
      </a>
    {/if}
  </div>
</nav>

<form class="admin-busca" method="GET">
  <label class="admin-campo">
    <span>Buscar por e-mail</span>
    <input type="search" name="busca" value={data.busca} placeholder="parte do e-mail" />
  </label>
  <BotaoPill variante="neutro" tipo="submit">Buscar</BotaoPill>
</form>

<section class="admin-secao">
  <h2 class="admin-secao-titulo">{data.usuarios.length} conta(s)</h2>

  {#if data.truncada}
    <p class="admin-secao-texto">
      Mostrando apenas as {data.usuarios.length} contas mais recentes. Use a busca para encontrar uma
      conta que não esteja aqui.
    </p>
  {/if}

  <ul class="admin-tabela">
    {#each data.usuarios as usuario (usuario.id)}
      <li class="admin-linha">
        <span class="admin-linha-principal">
          <strong>{usuario.nome}</strong>
          <span class="admin-linha-meta">
            {usuario.email}
            {#if !usuario.emailVerificado}
              · e-mail não confirmado{/if}
          </span>
        </span>

        <span class="admin-linha-marcas">
          <Chip variante={usuario.papel === 'ESPECTADOR' ? 'neutro' : 'roxo'}>{usuario.papel}</Chip>

          <label class="admin-campo admin-seletor">
            <span class="admin-rotulo-oculto">Papel de {usuario.nome}</span>
            <select
              value={usuario.papel}
              on:change={(evento) => pedirTrocaDePapel(usuario, evento.currentTarget.value)}
            >
              {#each PAPEIS as papel (papel)}
                <option value={papel}>{papel}</option>
              {/each}
            </select>
            <SetaBaixo tamanho={14} />
          </label>

          <BotaoPill
            variante="neutro"
            on:click={() =>
              (pendente = {
                acao: 'remover-usuario',
                alvo: usuario.id,
                titulo: `Remover ${usuario.nome}`,
                descricao: 'Apaga a conta, a lista, o progresso e as avaliações dela.',
                aviso: 'Esta ação é definitiva e não pode ser desfeita.',
                palavraChave: 'REMOVER'
              })}
          >
            Remover
          </BotaoPill>
        </span>
      </li>
    {/each}
  </ul>
</section>

{#if pendente}
  <DialogoConfirmacao
    aberto
    titulo={pendente.titulo}
    descricao={pendente.descricao}
    avisoIrreversivel={pendente.aviso}
    exigencia={pendente.palavraChave
      ? { palavraChave: pendente.palavraChave }
      : { rotuloDaCaixa: 'Entendi que esta ação não pode ser desfeita' }}
    {processando}
    on:confirmado={confirmar}
    on:cancelado={() => (pendente = null)}
  />
{/if}
