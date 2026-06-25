import {
  calcularCustoPrevisto,
  resolverTipoTarifaCusto,
} from '@/features/transporte/lib/calcular-custo';
import type {
  CustoAdicionalItem,
  CustoFreteGraficos,
  CustoFreteIndicadores,
  CustoFreteInsights,
  CustoFreteItem,
  CustoFreteRealizado,
  CustoFreteSummary,
  NivelCusto,
  RankingTipoAdicional,
  RankingTransportadoraCusto,
  StatusCustoFrete,
  TipoCustoAdicional,
  TipoVeiculo,
  TransporteGrupo,
} from '@/features/transporte/types/transporte.schema';
import {
  STATUS_CUSTO_FRETE_LABELS,
  TIPO_CUSTO_ADICIONAL_LABELS,
} from '@/features/transporte/types/transporte.schema';

export type VariacaoCusto = {
  valor: number;
  percentual: number;
  nivel: NivelCusto;
};

export const CAPACIDADE_POR_TIPO: Record<
  TipoVeiculo,
  { peso: number; volume: number }
> = {
  VUC: { peso: 1200, volume: 8 },
  Truck_3_4: { peso: 3500, volume: 18 },
  Toco: { peso: 8000, volume: 35 },
  Carreta: { peso: 10000, volume: 45 },
  Bitrem: { peso: 40000, volume: 120 },
};

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export function calcularTotalAdicionais(itens: CustoAdicionalItem[]): number {
  const total = itens.reduce((acc, item) => acc + item.valor, 0);
  return arredondar(total);
}

export function calcularTotalPago(
  custoDiariaPago: number,
  custosAdicionais: CustoAdicionalItem[],
): number {
  return arredondar(custoDiariaPago + calcularTotalAdicionais(custosAdicionais));
}

export function resolverNivelVariacao(percentual: number): NivelCusto {
  if (percentual <= 5) {
    return 'dentro';
  }

  if (percentual <= 15) {
    return 'atencao';
  }

  return 'acima';
}

export function calcularVariacao(previsto: number, pago: number): VariacaoCusto {
  const valor = arredondar(pago - previsto);
  const percentual =
    previsto > 0 ? arredondar((valor / previsto) * 100) : pago > 0 ? 100 : 0;

  return {
    valor,
    percentual,
    nivel: resolverNivelVariacao(Math.abs(percentual)),
  };
}

export function resolverStatusCusto(variacao: VariacaoCusto): NivelCusto {
  return variacao.nivel;
}

function resolverCustoPrevisto(transporte: TransporteGrupo): number {
  if (transporte.freteSemCusto) {
    return 0;
  }

  if (transporte.custoPrevisto != null) {
    return transporte.custoPrevisto;
  }

  const tipoVeiculo = resolverTipoTarifaCusto(transporte);

  return calcularCustoPrevisto(tipoVeiculo).total;
}

export function montarCustoFreteItem(
  custoFrete: CustoFreteRealizado,
  transporte: TransporteGrupo,
): CustoFreteItem {
  const custoPrevisto = resolverCustoPrevisto(transporte);
  const variacao = calcularVariacao(custoPrevisto, custoFrete.totalPago);

  return {
    custoFrete,
    transporte,
    custoPrevisto,
    variacaoValor: variacao.valor,
    variacaoPercentual: variacao.percentual,
    nivelVariacao: variacao.nivel,
  };
}

export function calcularCustoFreteSummary(
  items: CustoFreteItem[],
): CustoFreteSummary {
  const totalPrevisto = arredondar(
    items.reduce((acc, item) => acc + item.custoPrevisto, 0),
  );
  const totalPago = arredondar(
    items.reduce((acc, item) => acc + item.custoFrete.totalPago, 0),
  );
  const variacao = calcularVariacao(totalPrevisto, totalPago);
  const pendentesLancamento = items.filter(
    (item) => item.custoFrete.status === 'pendente',
  ).length;

  return {
    totalPrevisto,
    totalPago,
    variacaoValor: variacao.valor,
    variacaoPercentual: variacao.percentual,
    pendentesLancamento,
  };
}

function resolverTransportadora(item: CustoFreteItem): string {
  return item.transporte.veiculoAlocado?.transportadora ?? 'Sem transportadora';
}

function distribuirAdicionaisPorCliente(
  items: CustoFreteItem[],
): Map<string, { total: number; rota: string }> {
  const mapa = new Map<string, { total: number; rota: string }>();

  for (const item of items) {
    const adicionais = item.custoFrete.totalAdicionais;

    if (adicionais <= 0) {
      continue;
    }

    const destinatarios = [
      ...new Set(item.transporte.remessas.map((remessa) => remessa.cliente)),
    ];

    if (destinatarios.length === 0) {
      continue;
    }

    const parcela = arredondar(adicionais / destinatarios.length);

    for (const cliente of destinatarios) {
      const atual = mapa.get(cliente) ?? { total: 0, rota: item.transporte.rota };
      mapa.set(cliente, {
        total: arredondar(atual.total + parcela),
        rota: atual.total >= parcela ? atual.rota : item.transporte.rota,
      });
    }
  }

  return mapa;
}

function maiorRanking<T extends { valor: number }>(
  entradas: T[],
  fallback: T,
): T {
  if (entradas.length === 0) {
    return fallback;
  }

  return entradas.reduce((maior, atual) =>
    atual.valor > maior.valor ? atual : maior,
  );
}

export function calcularCustoFreteInsights(
  items: CustoFreteItem[],
): CustoFreteInsights {
  const fallbackTransportadora = {
    label: '—',
    valor: 0,
    transportes: 0,
  };

  const fallbackRota = {
    label: '—',
    valor: 0,
    variacaoPercentual: 0,
  };

  const fallbackCliente = {
    label: '—',
    valor: 0,
    rota: '—',
  };

  const fallbackTipo = {
    label: TIPO_CUSTO_ADICIONAL_LABELS.outros,
    valor: 0,
    tipo: 'outros' as TipoCustoAdicional,
    ocorrencias: 0,
  };

  if (items.length === 0) {
    return {
      transportadoraMaiorCusto: fallbackTransportadora,
      rotaMaiorVariacao: fallbackRota,
      clienteMaiorAdicional: fallbackCliente,
      tipoAdicionalMaisFrequente: fallbackTipo,
      rotaMaiorAdicional: { label: '—', valor: 0 },
      contestados: { quantidade: 0, valorTotal: 0 },
    };
  }

  const porTransportadora = new Map<
    string,
    { totalPago: number; transportes: number }
  >();

  for (const item of items) {
    const nome = resolverTransportadora(item);
    const atual = porTransportadora.get(nome) ?? { totalPago: 0, transportes: 0 };
    porTransportadora.set(nome, {
      totalPago: arredondar(atual.totalPago + item.custoFrete.totalPago),
      transportes: atual.transportes + 1,
    });
  }

  const transportadoraMaiorCusto = maiorRanking(
    [...porTransportadora.entries()].map(([label, dados]) => ({
      label,
      valor: dados.totalPago,
      transportes: dados.transportes,
    })),
    fallbackTransportadora,
  );

  const rotaMaiorVariacao = maiorRanking(
    items
      .filter((item) => item.custoFrete.totalPago > 0)
      .map((item) => ({
        label: item.transporte.rota,
        valor: Math.abs(item.variacaoValor),
        variacaoPercentual: item.variacaoPercentual,
        detalhe: item.transporte.cidade,
      })),
    fallbackRota,
  );

  const clientes = distribuirAdicionaisPorCliente(items);
  const clienteMaiorAdicional = maiorRanking(
    [...clientes.entries()].map(([label, dados]) => ({
      label,
      valor: dados.total,
      rota: dados.rota,
    })),
    fallbackCliente,
  );

  const porTipo = new Map<
    TipoCustoAdicional,
    { ocorrencias: number; valor: number }
  >();

  for (const item of items) {
    for (const adicional of item.custoFrete.custosAdicionais) {
      const atual = porTipo.get(adicional.tipo) ?? { ocorrencias: 0, valor: 0 };
      porTipo.set(adicional.tipo, {
        ocorrencias: atual.ocorrencias + 1,
        valor: arredondar(atual.valor + adicional.valor),
      });
    }
  }

  const tipoAdicionalMaisFrequente = maiorRanking(
    [...porTipo.entries()].map(([tipo, dados]) => ({
      label: TIPO_CUSTO_ADICIONAL_LABELS[tipo],
      valor: dados.valor,
      tipo,
      ocorrencias: dados.ocorrencias,
    })),
    fallbackTipo,
  );

  const rotaMaiorAdicional = maiorRanking(
    items
      .filter((item) => item.custoFrete.totalAdicionais > 0)
      .map((item) => ({
        label: item.transporte.rota,
        valor: item.custoFrete.totalAdicionais,
        detalhe: resolverTransportadora(item),
      })),
    { label: '—', valor: 0 },
  );

  const contestados = items.filter(
    (item) => item.custoFrete.status === 'contestado',
  );

  return {
    transportadoraMaiorCusto,
    rotaMaiorVariacao,
    clienteMaiorAdicional,
    tipoAdicionalMaisFrequente,
    rotaMaiorAdicional,
    contestados: {
      quantidade: contestados.length,
      valorTotal: arredondar(
        contestados.reduce((acc, item) => acc + item.custoFrete.totalPago, 0),
      ),
    },
  };
}

function resolverTipoVeiculo(item: CustoFreteItem): TipoVeiculo {
  return (
    item.transporte.veiculoAlocado?.tipo ?? item.transporte.perfilEsperado
  );
}

function calcularDropsize(item: CustoFreteItem): number {
  if (item.transporte.quantidadeRemessas <= 0) {
    return 0;
  }

  return arredondar(
    item.transporte.pesoTotal / item.transporte.quantidadeRemessas,
  );
}

function calcularOcupacao(item: CustoFreteItem): number {
  const tipo = resolverTipoVeiculo(item);
  const capacidade = CAPACIDADE_POR_TIPO[tipo].peso;

  if (capacidade <= 0) {
    return 0;
  }

  return arredondar((item.transporte.pesoTotal / capacidade) * 100);
}

function mediaPonderada(
  valores: Array<{ valor: number; peso: number }>,
): number {
  const pesoTotal = valores.reduce((acc, item) => acc + item.peso, 0);

  if (pesoTotal <= 0) {
    return 0;
  }

  const soma = valores.reduce((acc, item) => acc + item.valor * item.peso, 0);
  return arredondar(soma / pesoTotal);
}

export function calcularIndicadoresTransporte(
  items: CustoFreteItem[],
): CustoFreteIndicadores {
  if (items.length === 0) {
    return {
      dropsizeMedio: 0,
      ocupacaoMedia: 0,
      custoPorKgMedio: 0,
      custoPorKmMedio: 0,
      rankingOcupacaoPorRota: [],
      rankingDropsizePorRota: [],
    };
  }

  const dropsizeMedio = mediaPonderada(
    items.map((item) => ({
      valor: calcularDropsize(item),
      peso: item.transporte.quantidadeRemessas,
    })),
  );

  const ocupacaoMedia = mediaPonderada(
    items.map((item) => ({
      valor: calcularOcupacao(item),
      peso: item.transporte.pesoTotal,
    })),
  );

  const itensComPago = items.filter((item) => item.custoFrete.totalPago > 0);

  const custoPorKgMedio = mediaPonderada(
    itensComPago.map((item) => ({
      valor:
        item.transporte.pesoTotal > 0
          ? item.custoFrete.totalPago / item.transporte.pesoTotal
          : 0,
      peso: item.transporte.pesoTotal,
    })),
  );

  const custoPorKmMedio = mediaPonderada(
    itensComPago.map((item) => ({
      valor:
        item.transporte.distanciaKm > 0
          ? item.custoFrete.totalPago / item.transporte.distanciaKm
          : 0,
      peso: item.transporte.distanciaKm,
    })),
  );

  const rankingOcupacaoPorRota = items
    .map((item) => ({
      rota: item.transporte.rota,
      ocupacao: calcularOcupacao(item),
      cidade: item.transporte.cidade,
      dropsize: calcularDropsize(item),
    }))
    .sort((a, b) => b.ocupacao - a.ocupacao);

  const rankingDropsizePorRota = items
    .map((item) => ({
      rota: item.transporte.rota,
      dropsize: calcularDropsize(item),
      remessas: item.transporte.quantidadeRemessas,
    }))
    .sort((a, b) => b.dropsize - a.dropsize);

  return {
    dropsizeMedio,
    ocupacaoMedia,
    custoPorKgMedio,
    custoPorKmMedio,
    rankingOcupacaoPorRota,
    rankingDropsizePorRota,
  };
}

export function calcularRankingTransportadora(
  items: CustoFreteItem[],
): RankingTransportadoraCusto[] {
  const mapa = new Map<string, { transportes: number; totalPago: number }>();

  for (const item of items) {
    const nome = resolverTransportadora(item);
    const atual = mapa.get(nome) ?? { transportes: 0, totalPago: 0 };
    mapa.set(nome, {
      transportes: atual.transportes + 1,
      totalPago: arredondar(atual.totalPago + item.custoFrete.totalPago),
    });
  }

  const totalGeral = arredondar(
    [...mapa.values()].reduce((acc, dados) => acc + dados.totalPago, 0),
  );

  return [...mapa.entries()]
    .map(([transportadora, dados]) => ({
      transportadora,
      transportes: dados.transportes,
      totalPago: dados.totalPago,
      percentualTotal:
        totalGeral > 0
          ? arredondar((dados.totalPago / totalGeral) * 100)
          : 0,
    }))
    .sort((a, b) => b.totalPago - a.totalPago);
}

export function calcularRankingTipoAdicional(
  items: CustoFreteItem[],
): RankingTipoAdicional[] {
  const mapa = new Map<
    TipoCustoAdicional,
    { ocorrencias: number; valorTotal: number }
  >();

  for (const item of items) {
    for (const adicional of item.custoFrete.custosAdicionais) {
      const atual = mapa.get(adicional.tipo) ?? { ocorrencias: 0, valorTotal: 0 };
      mapa.set(adicional.tipo, {
        ocorrencias: atual.ocorrencias + 1,
        valorTotal: arredondar(atual.valorTotal + adicional.valor),
      });
    }
  }

  return [...mapa.entries()]
    .map(([tipo, dados]) => ({
      tipo,
      label: TIPO_CUSTO_ADICIONAL_LABELS[tipo],
      ocorrencias: dados.ocorrencias,
      valorTotal: dados.valorTotal,
    }))
    .sort((a, b) => b.valorTotal - a.valorTotal);
}

const STATUS_ORDEM: StatusCustoFrete[] = ['pago', 'pendente', 'contestado'];

export function calcularDadosGraficos(items: CustoFreteItem[]): CustoFreteGraficos {
  const previstoVsPagoPorRota = items
    .map((item) => ({
      rota: item.transporte.rota,
      previsto: item.custoPrevisto,
      pago: item.custoFrete.totalPago,
      variacao: item.variacaoValor,
    }))
    .sort((a, b) => b.pago - a.pago);

  const porStatus = new Map<StatusCustoFrete, number>();

  for (const status of STATUS_ORDEM) {
    porStatus.set(status, 0);
  }

  for (const item of items) {
    const atual = porStatus.get(item.custoFrete.status) ?? 0;
    porStatus.set(item.custoFrete.status, atual + 1);
  }

  const distribuicaoStatus = STATUS_ORDEM.map((status) => ({
    status,
    quantidade: porStatus.get(status) ?? 0,
  })).filter((item) => item.quantidade > 0);

  return {
    previstoVsPagoPorRota,
    distribuicaoStatus,
  };
}
