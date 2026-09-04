<!-- Arquivo: src/lib/componentes/detalhes/painel-trailers.svelte -->
<!-- Coluna direita: "Trailers >", "Mais episodios >" e o botao largo do fim. A duracao
     entrou pra DENTRO da arte, como veu no canto: fora dela era mais uma linha de
     texto cinza embaixo do nome, e o cartao ficava com tres alturas de legenda. -->
<script lang="ts">
  import './painel-trailers.css';
  import SetaDireita from '$visual/icones/seta-direita.svelte';
  import Play from '$visual/icones/play.svelte';
  import Chip from '../comum/chip.svelte';

  export let slug: string;
  export let arteDoTrailer: string;
  export let nomeDoTrailer: string;
  export let duracaoDoTrailer: string;
  export let maisEpisodios: {
    id: string;
    numero: number;
    nome: string;
    duracaoMinutos: number;
    miniatura: string;
  }[];
</script>

<aside class="painel-lateral" aria-label="Trailers e mais episódios">
  <section>
    <h2 class="painel-titulo">Trailers <SetaDireita tamanho={14} /></h2>
    <a class="trailer" href={`/titulo/${slug}`}>
      <span class="trailer-arte">
        <img src={arteDoTrailer} alt="" aria-hidden="true" loading="lazy" decoding="async" />
        <span class="trailer-play"><Play tamanho={18} /></span>
        <span class="trailer-duracao">{duracaoDoTrailer}</span>
      </span>
      <span class="trailer-nome">{nomeDoTrailer}</span>
    </a>
  </section>

  <section>
    <h2 class="painel-titulo">Mais episódios <SetaDireita tamanho={14} /></h2>
    <ul class="painel-episodios">
      {#each maisEpisodios as episodio (episodio.id)}
        <li>
          <a class="painel-episodio" href={`/assistir/${episodio.id}`}>
            <img
              src={episodio.miniatura}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
            />
            <span class="painel-episodio-corpo">
              <span class="painel-episodio-nome">{episodio.numero}. {episodio.nome}</span>
              <span class="painel-episodio-duracao">{episodio.duracaoMinutos}min</span>
              <span class="painel-episodio-chips">
                <Chip>Legendas Br</Chip>
                <Chip variante="neutro">PT</Chip>
              </span>
            </span>
          </a>
        </li>
      {/each}
    </ul>

    <a class="painel-ver-todos" href={`/titulo/${slug}`}>Ver todos os episódios</a>
  </section>
</aside>
