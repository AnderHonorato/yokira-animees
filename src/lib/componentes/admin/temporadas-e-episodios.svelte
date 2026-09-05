<!-- Arquivo: src/lib/componentes/admin/temporadas-e-episodios.svelte -->
<!-- Temporadas, episodios e os formularios de criacao/edicao. As acoes que APAGAM
     apenas despacham o evento: quem abre o dialogo de dupla confirmacao e a pagina.
     O campo de estreia vazio significa "no ar agora"; com data futura o episodio fica
     visivel so aqui no painel ate a hora chegar. -->
<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import BotaoPill from '$componentes/comum/botao-pill.svelte';
  import Chip from '$componentes/comum/chip.svelte';
  import EscolherCapa from './escolher-capa.svelte';
  import CriarEpisodiosEmLote from './criar-episodios-em-lote.svelte';
  import SoltarVideo from './soltar-video.svelte';
  import { agendado, paraCampoLocal, rotuloDeEstreia } from './estreia-no-formulario';
  import { acompanharEpisodios, type EstadoDoVideo } from './estado-do-video';
  import { enfileirarEnvio, envios } from '$cliente/fila-de-envio';
  import { avisar, avisarErro } from '$cliente/avisos';

  interface EpisodioListado {
    id: string;
    numero: number;
    nome: string;
    duracaoSegundos: number;
    publicadoEm: Date;
    miniaturaUrl: string | null;
    _count: { arquivos: number };
  }

  interface TemporadaListada {
    id: string;
    numero: number;
    nome: string;
    episodios: EpisodioListado[];
  }

  export let temporadas: TemporadaListada[];

  const despachar = createEventDispatcher<{
    apagarTemporada: TemporadaListada;
    apagarEpisodio: EpisodioListado;
  }>();

  let editando: string | null = null;

  // O acompanhamento le a lista na HORA de consultar, direto da prop: assim ele nasce
  // uma vez so e continua valendo quando um episodio novo aparece. Ler de uma
  // variavel reativa nao serviria — na primeira renderizacao ela ainda nao existe.
  const acompanhamento = acompanharEpisodios(() =>
    temporadas.flatMap((temporada) => temporada.episodios.map((episodio) => episodio.id))
  );
  const estados = acompanhamento.estados;
  onDestroy(acompanhamento.encerrar);

  /** Envio em andamento deste episodio, se houver. */
  $: envioPorEpisodio = new Map(
    $envios
      .filter((envio) => envio.situacao === 'na-fila' || envio.situacao === 'enviando')
      .map((envio) => [envio.episodioId, envio])
  );

  function rotuloDoEpisodio(
    temporada: TemporadaListada,
    episodio: { numero: number; nome: string }
  ) {
    return `T${temporada.numero} EP${episodio.numero} — ${episodio.nome}`;
  }

  /** Texto e cor do selo de video: envio na frente, conversao depois. */
  function selo(
    episodio: EpisodioListado,
    estado: EstadoDoVideo | undefined,
    enviando: { bytes: number; enviados: number } | undefined
  ): { texto: string; variante: 'roxo' | 'neutro' | 'erro' } {
    if (enviando) {
      const parte =
        enviando.bytes === 0 ? 0 : Math.round((enviando.enviados / enviando.bytes) * 100);
      return { texto: `Enviando ${parte}%`, variante: 'roxo' };
    }
    if (estado?.situacao === 'na-fila')
      return { texto: 'Aguardando conversão', variante: 'neutro' };
    if (estado?.situacao === 'convertendo')
      return { texto: `Convertendo ${estado.progresso}%`, variante: 'roxo' };
    if (estado?.situacao === 'falhou') return { texto: 'Falhou na conversão', variante: 'erro' };
    if (estado?.situacao === 'pronto' || episodio._count.arquivos > 0)
      return { texto: 'Vídeo pronto', variante: 'roxo' };
    return { texto: 'Sem vídeo', variante: 'neutro' };
  }

  function enviarParaEpisodio(
    temporada: TemporadaListada,
    episodio: EpisodioListado,
    arquivos: File[]
  ) {
    // Um episodio recebe um video: se caírem varios, vale o primeiro. Criar episodio
    // a partir do resto seria adivinhar — pra isso existe a zona da temporada.
    enfileirarEnvio(episodio.id, rotuloDoEpisodio(temporada, episodio), arquivos[0]);
    void esperarEAtualizar();
  }

  /**
   * Arquivos soltos na temporada: cria um episodio por arquivo e enfileira os envios.
   * O cadastro vai numa requisicao curta e os videos sobem depois — uma queda no meio
   * do envio deixa os episodios criados, e nao um lote pela metade.
   */
  async function enviarParaTemporada(temporada: TemporadaListada, arquivos: File[]) {
    try {
      const resposta = await fetch('/api/admin/envio/episodios', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          temporadaId: temporada.id,
          nomes: arquivos.map((arquivo) => arquivo.name)
        })
      });
      if (!resposta.ok) {
        const detalhe = (await resposta.json().catch(() => null)) as { message?: string } | null;
        throw new Error(detalhe?.message ?? 'Não foi possível criar os episódios.');
      }

      const { episodios } = (await resposta.json()) as {
        episodios: Array<{ id: string; numero: number; nome: string }>;
      };

      episodios.forEach((episodio, posicao) => {
        enfileirarEnvio(episodio.id, rotuloDoEpisodio(temporada, episodio), arquivos[posicao]);
      });

      avisar(`${episodios.length} episódio(s) criado(s). O envio já começou.`, 'sucesso');
      await invalidateAll();
      void esperarEAtualizar();
    } catch (erro) {
      avisarErro(erro);
    }
  }

  /**
   * Arquivos do formulario de lote: os episodios ja foram criados pela action, com a
   * numeracao e o agendamento que a pessoa escolheu. Aqui so casamos arquivo com
   * episodio pelo NUMERO — e a unica ligacao confiavel, porque a action nao devolve
   * os ids e o nome do arquivo nao entra na numeracao.
   */
  function enfileirarDoLote(detalhe: {
    temporadaId: string;
    numeroInicial: number;
    arquivos: File[];
  }) {
    const temporada = temporadas.find((item) => item.id === detalhe.temporadaId);
    if (!temporada) return;

    let enfileirados = 0;
    detalhe.arquivos.forEach((arquivo, posicao) => {
      const numero = detalhe.numeroInicial + posicao;
      const episodio = temporada.episodios.find((item) => item.numero === numero);
      // Numero ja ocupado: a action pulou aquele item e avisou na mensagem dela.
      // Enfileirar mesmo assim sobrescreveria o video de um episodio antigo.
      if (!episodio) return;
      enfileirarEnvio(episodio.id, rotuloDoEpisodio(temporada, episodio), arquivo);
      enfileirados += 1;
    });

    if (enfileirados > 0) avisar(`${enfileirados} vídeo(s) na fila de envio.`, 'sucesso');
    void esperarEAtualizar();
  }

  /** Pergunta o estado logo depois de o envio terminar, sem esperar o proximo ciclo. */
  async function esperarEAtualizar() {
    await acompanhamento.atualizar();
  }

  // Quando a fila esvazia, algo acabou de chegar no servidor: vale reconsultar na
  // hora, em vez de esperar o proximo ciclo de tres segundos. Fica numa assinatura,
  // e nao num bloco reativo, porque o que interessa e a TRANSICAO de "tinha envio"
  // pra "nao tem mais" — e um bloco reativo nao guarda o valor anterior.
  let enviosAtivos = 0;
  onDestroy(
    envios.subscribe((itens) => {
      const ativos = itens.filter(
        (envio) => envio.situacao === 'na-fila' || envio.situacao === 'enviando'
      ).length;
      if (enviosAtivos > 0 && ativos === 0) void esperarEAtualizar();
      enviosAtivos = ativos;
    })
  );
</script>

<section class="admin-secao">
  <h2 class="admin-secao-titulo">Temporadas e episódios</h2>

  <form class="admin-forma-inline" method="POST" action="?/criarTemporada">
    <label class="admin-campo">
      <span>Número</span>
      <input type="number" name="numero" min="1" max="99" required />
    </label>
    <label class="admin-campo admin-campo-largo">
      <span>Nome da temporada</span>
      <input name="nome" required maxlength="80" placeholder="Primeira temporada" />
    </label>
    <BotaoPill variante="neutro" tipo="submit">Adicionar temporada</BotaoPill>
  </form>

  {#if temporadas.length === 0}
    <p class="admin-secao-texto">Nenhuma temporada ainda.</p>
  {/if}

  {#each temporadas as temporada (temporada.id)}
    <article class="admin-temporada">
      <header class="admin-temporada-cabecalho">
        <h3>T{temporada.numero} · {temporada.nome}</h3>
        <BotaoPill variante="neutro" on:click={() => despachar('apagarTemporada', temporada)}>
          Excluir temporada
        </BotaoPill>
      </header>

      <ul class="admin-episodios">
        {#each temporada.episodios as episodio (episodio.id)}
          <li class="admin-episodio">
            {#if editando === episodio.id}
              <form class="admin-forma-inline" method="POST" action="?/salvarEpisodio">
                <input type="hidden" name="episodioId" value={episodio.id} />
                <label class="admin-campo">
                  <span>Nº</span>
                  <input type="number" name="numero" value={episodio.numero} min="1" required />
                </label>
                <label class="admin-campo admin-campo-largo">
                  <span>Nome</span>
                  <input name="nome" value={episodio.nome} required maxlength="160" />
                </label>
                <label class="admin-campo">
                  <span>Min</span>
                  <input
                    type="number"
                    name="duracao"
                    value={Math.round(episodio.duracaoSegundos / 60)}
                    min="1"
                    required
                  />
                </label>
                <label class="admin-campo">
                  <span>Estreia</span>
                  <input
                    type="datetime-local"
                    name="estreia"
                    value={paraCampoLocal(episodio.publicadoEm)}
                  />
                </label>
                <BotaoPill variante="marca" tipo="submit">Salvar</BotaoPill>
                <BotaoPill variante="neutro" on:click={() => (editando = null)}>Cancelar</BotaoPill>
              </form>

              <!-- Sem episodio escolhido, o quadro sai do video deste mesmo episodio. -->
              <EscolherCapa
                acao="?/definirCapa"
                alvo="episodio"
                rotulo="Miniatura do episódio"
                episodioId={episodio.id}
                atual={episodio.miniaturaUrl}
              />
            {:else}
              {@const estadoDoVideo = $estados[episodio.id]}
              {@const emEnvio = envioPorEpisodio.get(episodio.id)}
              {@const marca = selo(episodio, estadoDoVideo, emEnvio)}
              <span class="admin-episodio-nome">
                {episodio.numero}. {episodio.nome}
                <span class="admin-linha-meta">{Math.round(episodio.duracaoSegundos / 60)}min</span>
              </span>
              <span class="admin-episodio-acoes">
                {#if agendado(episodio.publicadoEm)}
                  <Chip variante="neutro">Estreia {rotuloDeEstreia(episodio.publicadoEm)}</Chip>
                {/if}

                <!-- Um selo so pro video, contando a historia inteira: enviando,
                     aguardando vaga, convertendo, pronto ou falhou. Antes eram dois
                     estados possiveis ("enviado"/"sem vídeo") e tudo que acontecia
                     entre eles era invisivel. -->
                <Chip variante={marca.variante}>{marca.texto}</Chip>

                {#if !emEnvio && estadoDoVideo?.situacao !== 'convertendo'}
                  <SoltarVideo
                    compacto
                    destino={rotuloDoEpisodio(temporada, episodio)}
                    rotulo={marca.texto === 'Sem vídeo' ? 'Enviar vídeo' : 'Trocar vídeo'}
                    on:arquivos={(evento) =>
                      enviarParaEpisodio(temporada, episodio, evento.detail.arquivos)}
                  />
                {/if}

                <BotaoPill variante="neutro" on:click={() => (editando = episodio.id)}>
                  Editar
                </BotaoPill>
                <BotaoPill variante="neutro" on:click={() => despachar('apagarEpisodio', episodio)}>
                  Excluir
                </BotaoPill>
              </span>
            {/if}
          </li>
        {/each}
      </ul>

      <!-- Soltar a temporada inteira aqui: cada arquivo vira um episodio, com o nome
           do proprio arquivo, e os videos sobem em fila. E o caminho curto — quem
           quer numerar, agendar estreia ou colar links usa o formulario abaixo. -->
      <SoltarVideo
        multiplo
        destino={`T${temporada.numero}`}
        rotulo="Soltar os episódios desta temporada"
        on:arquivos={(evento) => enviarParaTemporada(temporada, evento.detail.arquivos)}
      />

      <CriarEpisodiosEmLote
        temporadaId={temporada.id}
        proximoNumero={Math.max(0, ...temporada.episodios.map((e) => e.numero)) + 1}
        on:enviarArquivos={(evento) => enfileirarDoLote(evento.detail)}
      />

      <form class="admin-forma-inline" method="POST" action="?/criarEpisodio">
        <input type="hidden" name="temporadaId" value={temporada.id} />
        <label class="admin-campo">
          <span>Nº</span>
          <input type="number" name="numero" min="1" required />
        </label>
        <label class="admin-campo admin-campo-largo">
          <span>Nome do episódio</span>
          <input name="nome" required maxlength="160" />
        </label>
        <label class="admin-campo">
          <span>Min</span>
          <input type="number" name="duracao" min="1" value="24" required />
        </label>
        <label class="admin-campo">
          <span>Estreia</span>
          <input type="datetime-local" name="estreia" />
        </label>
        <BotaoPill variante="neutro" tipo="submit">Adicionar episódio</BotaoPill>
      </form>
    </article>
  {/each}
</section>
