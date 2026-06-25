import { gerarDemandasEmpilhadeira } from '@/features/transporte/lib/gerar-demandas-empilhadeira';
import { gerarItensSeparacaoTransporte } from '@/features/transporte/lib/gerar-itens-separacao';
import {
  gerarQrValidacaoMapa,
  resolverDestinoBloco,
  resolverDestinoItem,
} from '@/features/transporte/lib/resolver-destino-alocacao';
import {
  OPCOES_TIPO_SEPARACAO,
  type BlocoMapaSeparacao,
  type ConfigImpressaoMapaSeparacao,
  type ItemSeparacao,
  type OrdenacaoMapa,
  type ResultadoMapasSeparacao,
  type ResumoImpressaoMapaSeparacao,
  type TipoSeparacao,
} from '@/features/transporte/types/impressao-mapa-separacao.schema';
import type { TransporteGrupo } from '@/features/transporte/types/transporte.schema';

const PEDIDOS_POR_ONDA = 3;
const PEDIDOS_POR_CLUSTER = 4;

function ordenarItens(
  itens: ItemSeparacao[],
  ordenacao: OrdenacaoMapa,
): ItemSeparacao[] {
  const copia = [...itens];

  switch (ordenacao) {
    case 'peso':
      return copia.sort((a, b) => b.peso - a.peso || a.endereco.localeCompare(b.endereco));
    case 'volume':
      return copia.sort(
        (a, b) => b.volume - a.volume || a.endereco.localeCompare(b.endereco),
      );
    case 'pedido':
      return copia.sort(
        (a, b) =>
          a.numeroNF.localeCompare(b.numeroNF) ||
          a.endereco.localeCompare(b.endereco),
      );
    case 'endereco':
    default:
      return copia.sort((a, b) => a.endereco.localeCompare(b.endereco));
  }
}

function calcularFolhas(itens: number, itensPorFolha: number): number {
  if (itens === 0) {
    return 0;
  }

  if (itensPorFolha === 0) {
    return 1;
  }

  return Math.ceil(itens / itensPorFolha);
}

function atribuirOperadores<T>(
  grupos: T[],
  operadores: string[],
  mapaPorOperador: boolean,
): Array<{ grupo: T; operador?: string }> {
  if (!mapaPorOperador || operadores.length === 0) {
    return grupos.map((grupo) => ({ grupo }));
  }

  return grupos.map((grupo, index) => ({
    grupo,
    operador: operadores[index % operadores.length],
  }));
}

function criarBloco(
  id: string,
  titulo: string,
  itens: ItemSeparacao[],
  config: ConfigImpressaoMapaSeparacao,
  transporte: TransporteGrupo,
  extras?: Partial<BlocoMapaSeparacao>,
): BlocoMapaSeparacao {
  const agrupador = extras?.agrupador ?? titulo;
  const destinoAlocacao = resolverDestinoBloco(config, transporte, agrupador);
  const itensOrdenados = ordenarItens(itens, config.ordenacao).map((item) => ({
    ...item,
    enderecoAlocacao: resolverDestinoItem(
      config,
      transporte,
      item,
      destinoAlocacao,
    ),
  }));

  return {
    id,
    titulo,
    agrupador,
    subtitulo: extras?.subtitulo,
    operador: extras?.operador,
    itens: itensOrdenados,
    folhas: calcularFolhas(itensOrdenados.length, config.itensPorFolha),
    destinoAlocacao,
    qrCodeValor: gerarQrValidacaoMapa(
      transporte.id,
      id,
      config.tipoSeparacao,
    ),
    possuiPaleteFechado: itensOrdenados.some((item) => item.paleteFechado),
  };
}

function agruparPorCampo(
  itens: ItemSeparacao[],
  campo: keyof Pick<ItemSeparacao, 'remessaId' | 'zona' | 'corredor' | 'sku' | 'rotaEntrega'>,
): Map<string, ItemSeparacao[]> {
  const mapa = new Map<string, ItemSeparacao[]>();

  itens.forEach((item) => {
    const chave = String(item[campo]);
    const atual = mapa.get(chave) ?? [];
    atual.push(item);
    mapa.set(chave, atual);
  });

  return mapa;
}

function montarDiscreto(
  itens: ItemSeparacao[],
  config: ConfigImpressaoMapaSeparacao,
  transporte: TransporteGrupo,
): BlocoMapaSeparacao[] {
  const porPedido = agruparPorCampo(itens, 'remessaId');
  const pedidos = [...porPedido.entries()].sort((a, b) => {
    const nfA = a[1][0]?.numeroNF ?? '';
    const nfB = b[1][0]?.numeroNF ?? '';
    return nfA.localeCompare(nfB);
  });

  return atribuirOperadores(pedidos, config.operadores, config.mapaPorOperador).map(
    ({ grupo: [remessaId, linhas], operador }) => {
      const base = linhas[0];
      if (!base) {
        throw new Error(`Pedido ${remessaId} sem linhas de separação`);
      }

      return criarBloco(
        `pedido-${remessaId}`,
        `Pedido ${base.numeroNF}`,
        linhas,
        config,
        transporte,
        {
          agrupador: remessaId,
          subtitulo: `${base.destinoCliente} · ${linhas.length} SKU(s)`,
          operador,
        },
      );
    },
  );
}

function montarPorZona(
  itens: ItemSeparacao[],
  config: ConfigImpressaoMapaSeparacao,
  transporte: TransporteGrupo,
): BlocoMapaSeparacao[] {
  const porZona = agruparPorCampo(itens, 'zona');
  const zonas = [...porZona.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  return atribuirOperadores(zonas, config.operadores, config.mapaPorOperador).map(
    ({ grupo: [zona, linhas], operador }) =>
      criarBloco(`zona-${zona}`, `Zona ${zona}`, linhas, config, transporte, {
        agrupador: zona,
        subtitulo: `${new Set(linhas.map((l) => l.numeroNF)).size} pedido(s) · ${linhas.length} linha(s)`,
        operador,
      }),
  );
}

function montarPorOnda(
  itens: ItemSeparacao[],
  config: ConfigImpressaoMapaSeparacao,
  transporte: TransporteGrupo,
): BlocoMapaSeparacao[] {
  const porPedido = agruparPorCampo(itens, 'remessaId');
  const pedidos = [...porPedido.entries()].sort((a, b) => {
    const nfA = a[1][0]?.numeroNF ?? '';
    const nfB = b[1][0]?.numeroNF ?? '';
    return nfA.localeCompare(nfB);
  });

  const ondas: ItemSeparacao[][] = [];
  for (let i = 0; i < pedidos.length; i += PEDIDOS_POR_ONDA) {
    const fatia = pedidos.slice(i, i + PEDIDOS_POR_ONDA);
    ondas.push(fatia.flatMap(([, linhas]) => linhas));
  }

  return atribuirOperadores(ondas, config.operadores, config.mapaPorOperador).map(
    ({ grupo: linhas, operador }, index) => {
      const pedidosNaOnda = new Set(linhas.map((l) => l.numeroNF));
      return criarBloco(
        `onda-${index + 1}`,
        `Onda ${String(index + 1).padStart(2, '0')}`,
        linhas,
        config,
        transporte,
        {
          agrupador: `onda-${index + 1}`,
          subtitulo: `${pedidosNaOnda.size} pedido(s) liberados simultaneamente`,
          operador,
        },
      );
    },
  );
}

function montarPorCluster(
  itens: ItemSeparacao[],
  config: ConfigImpressaoMapaSeparacao,
  transporte: TransporteGrupo,
): BlocoMapaSeparacao[] {
  const porPedido = agruparPorCampo(itens, 'remessaId');
  const pedidos = [...porPedido.entries()].sort((a, b) => {
    const nfA = a[1][0]?.numeroNF ?? '';
    const nfB = b[1][0]?.numeroNF ?? '';
    return nfA.localeCompare(nfB);
  });

  const clusters: ItemSeparacao[][] = [];
  for (let i = 0; i < pedidos.length; i += PEDIDOS_POR_CLUSTER) {
    const fatia = pedidos.slice(i, i + PEDIDOS_POR_CLUSTER);
    clusters.push(fatia.flatMap(([, linhas]) => linhas));
  }

  return atribuirOperadores(clusters, config.operadores, config.mapaPorOperador).map(
    ({ grupo: linhas, operador }, index) => {
      const nfs = [...new Set(linhas.map((l) => l.numeroNF))];
      return criarBloco(
        `cluster-${index + 1}`,
        `Cluster / Carrinho ${String(index + 1).padStart(2, '0')}`,
        linhas,
        config,
        transporte,
        {
          agrupador: `cluster-${index + 1}`,
          subtitulo: `Pedidos: ${nfs.join(', ')}`,
          operador,
        },
      );
    },
  );
}

function montarPorCorredor(
  itens: ItemSeparacao[],
  config: ConfigImpressaoMapaSeparacao,
  transporte: TransporteGrupo,
): BlocoMapaSeparacao[] {
  const porCorredor = agruparPorCampo(itens, 'corredor');
  const corredores = [...porCorredor.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  return atribuirOperadores(
    corredores,
    config.operadores,
    config.mapaPorOperador,
  ).map(({ grupo: [corredor, linhas], operador }) =>
    criarBloco(
      `corredor-${corredor}`,
      `Corredor ${corredor}`,
      linhas,
      config,
      transporte,
      {
        agrupador: corredor,
        subtitulo: `Rota sequencial · Zonas ${[...new Set(linhas.map((l) => l.zona))].join(', ')}`,
        operador,
      },
    ),
  );
}

function montarPorProduto(
  itens: ItemSeparacao[],
  config: ConfigImpressaoMapaSeparacao,
  transporte: TransporteGrupo,
): BlocoMapaSeparacao[] {
  const porSku = agruparPorCampo(itens, 'sku');
  const skus = [...porSku.entries()].sort((a, b) => {
    const nomeA = a[1][0]?.produto ?? '';
    const nomeB = b[1][0]?.produto ?? '';
    return nomeA.localeCompare(nomeB);
  });

  const linhasAgregadas = skus.map(([sku, linhas]) => {
    const base = linhas[0];
    if (!base) {
      throw new Error(`SKU ${sku} sem linhas de separação`);
    }

    const quantidadeTotal = linhas.reduce((acc, l) => acc + l.quantidade, 0);
    const pedidos = [...new Set(linhas.map((l) => l.numeroNF))];
    const enderecos = [...new Set(linhas.map((l) => l.endereco))].sort();

    const itemAgregado: ItemSeparacao = {
      ...base,
      id: `sku-agg-${sku}`,
      quantidade: quantidadeTotal,
      peso: linhas.reduce((acc, l) => acc + l.peso, 0),
      volume: linhas.reduce((acc, l) => acc + l.volume, 0),
      endereco: enderecos[0] ?? base.endereco,
      observacoes: `Atende ${pedidos.length} pedido(s): ${pedidos.join(', ')}`,
    };

    return { sku, item: itemAgregado, pedidos: pedidos.length };
  });

  return atribuirOperadores(
    linhasAgregadas,
    config.operadores,
    config.mapaPorOperador,
  ).map(({ grupo: { sku, item, pedidos }, operador }) =>
    criarBloco(`sku-${sku}`, `SKU ${sku}`, [item], config, transporte, {
      agrupador: sku,
      subtitulo: `${item.produto} · ${pedidos} pedido(s) · Qtd total ${item.quantidade}`,
      operador,
    }),
  );
}

function montarPorRota(
  itens: ItemSeparacao[],
  config: ConfigImpressaoMapaSeparacao,
  transporte: TransporteGrupo,
): BlocoMapaSeparacao[] {
  const porRota = agruparPorCampo(itens, 'rotaEntrega');
  const rotas = [...porRota.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  return atribuirOperadores(rotas, config.operadores, config.mapaPorOperador).map(
    ({ grupo: [rota, linhas], operador }) =>
      criarBloco(`rota-${rota}`, rota, linhas, config, transporte, {
        agrupador: rota,
        subtitulo: `${new Set(linhas.map((l) => l.destinoCliente)).size} cliente(s) · ${linhas.length} linha(s)`,
        operador,
      }),
  );
}

function montarPorEndereco(
  itens: ItemSeparacao[],
  config: ConfigImpressaoMapaSeparacao,
  transporte: TransporteGrupo,
): BlocoMapaSeparacao[] {
  const itensOrdenados = ordenarItens(itens, 'endereco');

  if (!config.mapaPorOperador || config.operadores.length === 0) {
    return [
      criarBloco(
        'sequencia-enderecos',
        'Sequência de Endereços',
        itensOrdenados,
        { ...config, ordenacao: 'endereco' },
        transporte,
        {
          agrupador: 'endereco-global',
          subtitulo: 'Coleta na ordem exata dos endereços do armazém',
        },
      ),
    ];
  }

  const tamanhoChunk = Math.ceil(itensOrdenados.length / config.operadores.length);

  return config.operadores.map((operador, index) => {
    const inicio = index * tamanhoChunk;
    const fatia = itensOrdenados.slice(inicio, inicio + tamanhoChunk);
    const primeiro = fatia[0]?.endereco ?? '—';
    const ultimo = fatia[fatia.length - 1]?.endereco ?? '—';

    return criarBloco(
      `endereco-op-${index + 1}`,
      `Trecho ${index + 1} — ${operador}`,
      fatia,
      { ...config, ordenacao: 'endereco' },
      transporte,
      {
        agrupador: `trecho-${index + 1}`,
        subtitulo: `De ${primeiro} até ${ultimo}`,
        operador,
      },
    );
  });
}

const MONTADORES: Record<
  TipoSeparacao,
  (
    itens: ItemSeparacao[],
    config: ConfigImpressaoMapaSeparacao,
    transporte: TransporteGrupo,
  ) => BlocoMapaSeparacao[]
> = {
  discreto: montarDiscreto,
  zona: montarPorZona,
  onda: montarPorOnda,
  cluster: montarPorCluster,
  corredor: montarPorCorredor,
  produto: montarPorProduto,
  rota: montarPorRota,
  endereco: montarPorEndereco,
};

export function montarMapasSeparacao(
  transporte: TransporteGrupo,
  config: ConfigImpressaoMapaSeparacao,
): ResultadoMapasSeparacao {
  const itens = gerarItensSeparacaoTransporte(transporte);
  const montador = MONTADORES[config.tipoSeparacao];
  const blocos = montador(itens, config, transporte);
  const demandasEmpilhadeira = gerarDemandasEmpilhadeira(
    blocos,
    config,
    transporte,
  );

  const totalMapas = blocos.length;
  const totalFolhasBase = blocos.reduce((acc, bloco) => acc + bloco.folhas, 0);
  const totalFolhas = totalFolhasBase * config.copias;

  const opcao = OPCOES_TIPO_SEPARACAO.find((item) => item.tipo === config.tipoSeparacao);
  const fator = opcao?.fatorTempo ?? 1;
  const tempoMinutos = Math.ceil(
    (itens.length / Math.max(1, config.operadores.length)) * 0.8 * fator,
  );

  return {
    blocos,
    demandasEmpilhadeira,
    totalItens: itens.length,
    totalMapas,
    totalFolhas,
    tempoMinutos,
    totalDemandasEmpilhadeira: demandasEmpilhadeira.length,
  };
}

function formatarTempo(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return horas > 0 ? `${horas}h ${mins}min` : `${mins} min`;
}

export function calcularResumoMapaSeparacao(
  transporte: TransporteGrupo | null,
  config: ConfigImpressaoMapaSeparacao,
): ResumoImpressaoMapaSeparacao {
  if (!transporte) {
    return {
      totalFolhas: 0,
      mapasBase: 0,
      operadores: 0,
      itensPorOperador: 0,
      tempoEstimado: '—',
      tempoMinutos: 0,
      pronto: false,
      totalItens: 0,
      totalBlocos: 0,
      totalDemandasEmpilhadeira: 0,
      totalPaletesFechados: 0,
    };
  }

  const resultado = montarMapasSeparacao(transporte, config);
  const numOperadores = Math.max(1, config.operadores.length);
  const totalPaletesFechados = resultado.blocos.reduce(
    (acc, bloco) =>
      acc + bloco.itens.filter((item) => item.paleteFechado).length,
    0,
  );

  return {
    totalFolhas: resultado.totalFolhas,
    mapasBase: resultado.totalMapas,
    operadores: numOperadores,
    itensPorOperador: Math.ceil(resultado.totalItens / numOperadores),
    tempoEstimado: formatarTempo(resultado.tempoMinutos),
    tempoMinutos: resultado.tempoMinutos,
    pronto: true,
    totalItens: resultado.totalItens,
    totalBlocos: resultado.blocos.length,
    totalDemandasEmpilhadeira: resultado.totalDemandasEmpilhadeira,
    totalPaletesFechados,
  };
}
