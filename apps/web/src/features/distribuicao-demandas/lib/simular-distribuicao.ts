import {
  aplicarBalanceamentoWorkloads,
  calcularResumoBalanceamento,
} from '@/features/distribuicao-demandas/lib/calcular-balanceamento';
import type {
  ConfigDistribuicao,
  Doca,
  Operador,
  TransporteExpedicao,
  Workload,
} from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

function resolverDocasAtivas(
  config: ConfigDistribuicao,
  docas: Doca[],
): Doca[] {
  const qtd = Math.max(1, config.qtdDocas);
  if (docas.length === 0) return [];

  const selecionadas = docas.filter((d) =>
    config.docasSelecionadasIds.includes(d.id),
  );
  const base = selecionadas.length > 0 ? selecionadas : docas;

  if (base.length >= qtd) {
    return base.slice(0, qtd);
  }

  const extras = docas.filter((d) => !base.some((b) => b.id === d.id));
  const combinadas = [...base, ...extras];

  if (combinadas.length >= qtd) {
    return combinadas.slice(0, qtd);
  }

  return Array.from({ length: qtd }, (_, i) => combinadas[i % combinadas.length]!);
}

function pesoTransporteParaEstrategia(
  transporte: TransporteExpedicao,
  estrategia: ConfigDistribuicao['estrategia'],
): number {
  switch (estrategia) {
    case 'caixas':
      return transporte.caixas;
    case 'tempo_estimado':
      return transporte.mapas.reduce((s, m) => s + m.enderecosUnicos.length, 0);
    case 'peso':
    case 'score_composto':
    default:
      return transporte.pesoTotalKg;
  }
}

function distribuirTransportesPorEstrategia(
  transportes: TransporteExpedicao[],
  qtdWorkloads: number,
  estrategia: ConfigDistribuicao['estrategia'],
): string[][] {
  if (qtdWorkloads <= 0) {
    return [transportes.map((t) => t.id)];
  }

  const buckets: string[][] = Array.from({ length: qtdWorkloads }, () => []);
  const ordenados = [...transportes].sort(
    (a, b) =>
      pesoTransporteParaEstrategia(b, estrategia) -
      pesoTransporteParaEstrategia(a, estrategia),
  );

  const cargas = Array(qtdWorkloads).fill(0);

  for (const transporte of ordenados) {
    const peso = pesoTransporteParaEstrategia(transporte, estrategia);
    const idx = cargas.indexOf(Math.min(...cargas));
    buckets[idx]!.push(transporte.id);
    cargas[idx]! += peso;
  }

  return buckets;
}

function atribuirOperadoresIniciais(
  workloads: Workload[],
  operadores: Operador[],
  config: ConfigDistribuicao,
): Workload[] {
  const separadores = operadores.filter((o) => o.funcao === 'separador');
  const conferentes = operadores.filter((o) => o.funcao === 'conferente');

  const sepPorWorkload = Math.max(
    1,
    Math.ceil(config.qtdFuncionarios / Math.max(1, workloads.length * 1.5)),
  );

  return workloads.map((w, i) => {
    const sepPorWl = Math.min(config.maxSeparadoresPorWorkload, sepPorWorkload);

    const sepInicio = (i * sepPorWl) % Math.max(separadores.length, 1);
    const separadorIds: string[] = [];

    for (let j = 0; j < sepPorWl && j < separadores.length; j++) {
      const op = separadores[(sepInicio + j) % separadores.length];
      if (op && !separadorIds.includes(op.id)) {
        separadorIds.push(op.id);
      }
    }

    const confIdx = i % Math.max(conferentes.length, 1);
    const conferenteIds =
      conferentes.length > 0 ? [conferentes[confIdx]!.id] : [];

    return { ...w, separadorIds, conferenteIds };
  });
}

export function simularDistribuicao(
  transportes: TransporteExpedicao[],
  config: ConfigDistribuicao,
  docas: Doca[],
  operadores: Operador[],
): {
  workloads: Workload[];
  transportesNaoAlocadosIds: string[];
  operadoresDisponiveisIds: string[];
} {
  const docasAtivas = resolverDocasAtivas(config, docas);
  const qtdWorkloads = docasAtivas.length > 0 ? docasAtivas.length : Math.max(1, config.qtdDocas);

  const transportesPorBucket = distribuirTransportesPorEstrategia(
    transportes,
    qtdWorkloads,
    config.estrategia,
  );

  let workloads: Workload[] = transportesPorBucket.map((transporteIds, i) => ({
    id: `wl-sessao-${i + 1}`,
    indice: i + 1,
    docaId: docasAtivas[i]?.id ?? docasAtivas[0]!.id,
    transporteIds,
    separadorIds: [],
    conferenteIds: [],
    metricas: {
      pesoKg: 0,
      caixas: 0,
      paletes: 0,
      carros: 0,
      enderecos: 0,
      transportes: 0,
      mapas: 0,
    },
    score: 0,
    statusEquilibrio: 'equilibrado' as const,
    desvioPercentual: 0,
  }));

  workloads = atribuirOperadoresIniciais(workloads, operadores, config);
  workloads = aplicarBalanceamentoWorkloads(
    workloads,
    operadores,
    transportes,
    config,
  );

  const alocados = new Set(workloads.flatMap((w) => w.transporteIds));
  const transportesNaoAlocadosIds = transportes
    .filter((t) => !alocados.has(t.id))
    .map((t) => t.id);

  const atribuidos = new Set(
    workloads.flatMap((w) => [...w.separadorIds, ...w.conferenteIds]),
  );

  const operadoresDisponiveisIds = operadores
    .filter((o) => !atribuidos.has(o.id) || o.funcao === 'conferente')
    .map((o) => o.id);

  return { workloads, transportesNaoAlocadosIds, operadoresDisponiveisIds };
}

export function recalcularEstadoDistribuicao(
  workloads: Workload[],
  operadores: Operador[],
  catalogoTransportes: TransporteExpedicao[],
  config: ConfigDistribuicao,
) {
  const atualizados = aplicarBalanceamentoWorkloads(
    workloads,
    operadores,
    catalogoTransportes,
    config,
  );
  const balanceamento = calcularResumoBalanceamento(atualizados);

  const alocados = new Set(atualizados.flatMap((w) => w.transporteIds));
  const transportesNaoAlocadosIds = catalogoTransportes
    .filter((t) => !alocados.has(t.id))
    .map((t) => t.id);

  return { workloads: atualizados, balanceamento, transportesNaoAlocadosIds };
}

export function aplicarSimulacaoCompleta(
  transportes: TransporteExpedicao[],
  config: ConfigDistribuicao,
  docas: Doca[],
  operadores: Operador[],
) {
  const { workloads, transportesNaoAlocadosIds, operadoresDisponiveisIds } =
    simularDistribuicao(transportes, config, docas, operadores);
  const balanceamento = calcularResumoBalanceamento(workloads);
  return { workloads, balanceamento, transportesNaoAlocadosIds, operadoresDisponiveisIds };
}

export function recalcularComConfigAtual(
  workloads: Workload[],
  transportes: TransporteExpedicao[],
  config: ConfigDistribuicao,
  docas: Doca[],
  operadores: Operador[],
) {
  const docasAtivas = resolverDocasAtivas(config, docas);
  const qtdAlvo = docasAtivas.length > 0 ? docasAtivas.length : Math.max(1, config.qtdDocas);

  if (workloads.length !== qtdAlvo) {
    return aplicarSimulacaoCompleta(transportes, config, docas, operadores);
  }

  const workloadsAtualizados = workloads.map((w, i) => ({
    ...w,
    indice: i + 1,
    docaId: docasAtivas[i]?.id ?? docasAtivas[0]?.id ?? w.docaId,
  }));

  const comOperadores = atribuirOperadoresIniciais(
    workloadsAtualizados,
    operadores,
    config,
  );

  return recalcularEstadoDistribuicao(
    comOperadores,
    operadores,
    transportes,
    config,
  );
}
