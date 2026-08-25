<!-- Arquivo: src/lib/componentes/casca/cabecalho.svelte -->
<!-- Cabecalho das tres telas: logo a esquerda, navegacao, e a direita busca/idioma/avatar. -->
<!-- No mobile a navegacao cai pra linha de baixo (imagens 1 e 2); no desktop fica na mesma linha. -->
<script lang="ts">
  import './cabecalho.css';
  import LogoYokira from '$visual/marca/logo-yokira.svelte';
  import Lupa from '$visual/icones/lupa.svelte';
  import Perfil from '$visual/icones/perfil.svelte';
  import SetaBaixo from '$visual/icones/seta-baixo.svelte';
  import NavegacaoPrincipal from './navegacao-principal.svelte';
  import type { UsuarioDaSessao } from '$servidor/autenticacao/sessao';

  export let usuario: UsuarioDaSessao | null = null;
</script>

<header class="cabecalho">
  <div class="cabecalho-faixa">
    <a class="cabecalho-logo" href="/" aria-label="Yōkira Animes — página inicial">
      <LogoYokira />
    </a>

    <div class="cabecalho-acoes">
      <a class="cabecalho-botao-icone" href="/buscar" aria-label="Buscar títulos">
        <Lupa tamanho={20} />
      </a>

      <button class="cabecalho-idioma" type="button" aria-label="Idioma da interface: português">
        <span>PT</span>
        <SetaBaixo tamanho={14} />
      </button>

      <a
        class="cabecalho-avatar"
        href={usuario ? '/configuracoes' : '/entrar'}
        aria-label={usuario ? `Conta de ${usuario.nome}` : 'Entrar na conta'}
      >
        <Perfil tamanho={18} />
      </a>

      {#if !usuario}
        <a class="cabecalho-assinar" href="/entrar">Assinar e Logar</a>
      {/if}
    </div>

    <!-- Uma unica instancia da navegacao. Antes havia duas (uma escondida por
         media query), o que duplicava links no DOM e confundia leitor de tela. -->
    <div class="cabecalho-navegacao">
      <NavegacaoPrincipal />
    </div>
  </div>
</header>
