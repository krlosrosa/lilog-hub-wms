import type {
  ConfigDistribuicao,
  EstrategiaBalanceamento,
  Operador,
  StatusEquilibrio,
  TransporteExpedicao,
  Workload,
  WorkloadMetricas,
} from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

export function calcularMetricasTransportes(
  transportes: TransporteExpedicao[],
): WorkloadMetricas {
  const enderecos = new Set(
    transportes.flatMap((t) => t.mapas.flatMap((m) => m.enderecosUnicos)),
  );

  return {
    pesoKg: transportes.reduce((s, t) => s + t.pesoTotalKg, 0),
    caixas: transportes.reduce((s, t) => s + t.caixas, 0),
    paletes: transportes.reduce((s, t) => s + t.totalPaletes, 0),
    carros: transportes.reduce((s, t) => s + t.carros, 0),
    enderecos: enderecos.size,
    transportes: transportes.length,
    mapas: transportes.reduce((s, t) => s + t.totalMapas, 0),
  };
}

export function resolverTransportesWorkload(
  workload: Workload,
  catalogo: TransporteExpedicao[],
): TransporteExpedicao[] {
  return workload.transporteIds
    .map((id) => catalogo.find((t) => t.id === id))
    .filter((t): t is TransporteExpedicao => Boolean(t));
}

export function calcularScoreWorkload(
  metricas: WorkloadMetricas,
  separadores: Operador[],
  estrategia: EstrategiaBalanceamento,
): number {
  const prodMedia =
    separadores.length > 0
      ? separadores.reduce((s, o) => s + o.produtividadeMedia, 0) / separadores.length
      : 70;

  switch (estrategia) {
    case 'peso':
      return Math.round(metricas.pesoKg);
    case 'caixas':
      return Math.round(metricas.caixas * 10);
    case 'tempo_estimado': {
      const capacidade = separadores.reduce((s, o) => s + o.capacidadeKgH, 0) || 400;
      return Math.round((metricas.pesoKg / capacidade) * 100 * (100 / prodMedia));
    }
    case 'score_composto':
    default:
      return Math.round(
        metricas.pesoKg * 0.4 +
          metricas.caixas * 8 +
          metricas.carros * 15 +
          metricas.enderecos * 12 +
          metricas.transportes * 25,
      );
  }
}

export function classificarEquilibrio(
  score: number,
  scoreMedio: number,
): { status: StatusEquilibrio; desvioPercentual: number } {
  if (scoreMedio === 0) {
    return { status: 'equilibrado', desvioPercentual: 0 };
  }

  const desvioPercentual = ((score - scoreMedio) / scoreMedio) * 100;

  if (Math.abs(desvioPercentual) <= 8) {
    return { status: 'equilibrado', desvioPercentual };
  }

  if (desvioPercentual > 15) {
    return { status: 'sobrecarregado', desvioPercentual };
  }

  if (desvioPercentual < -15) {
    return { status: 'abaixo_media', desvioPercentual };
  }

  return {
    status: desvioPercentual > 0 ? 'sobrecarregado' : 'abaixo_media',
    desvioPercentual,
  };
}

export function aplicarBalanceamentoWorkloads(
  workloads: Workload[],
  operadores: Operador[],
  catalogoTransportes: TransporteExpedicao[],
  config: ConfigDistribuicao,
): Workload[] {
  const scoresBrutos = workloads.map((w) => {
    const separadores = operadores.filter((o) => w.separadorIds.includes(o.id));
    const transportes = resolverTransportesWorkload(w, catalogoTransportes);
    const metricas = calcularMetricasTransportes(transportes);
    return calcularScoreWorkload(metricas, separadores, config.estrategia);
  });

  const scoreMedio =
    scoresBrutos.length > 0
      ? scoresBrutos.reduce((s, v) => s + v, 0) / scoresBrutos.length
      : 0;

  return workloads.map((w) => {
    const transportes = resolverTransportesWorkload(w, catalogoTransportes);
    const metricas = calcularMetricasTransportes(transportes);
    const separadores = operadores.filter((o) => w.separadorIds.includes(o.id));
    const score = calcularScoreWorkload(metricas, separadores, config.estrategia);
    const { status, desvioPercentual } = classificarEquilibrio(score, scoreMedio);

    return {
      ...w,
      metricas,
      score,
      statusEquilibrio: status,
      desvioPercentual,
    };
  });
}

export function calcularResumoBalanceamento(workloads: Workload[]) {
  const scores = workloads.map((w) => w.score);
  const scoreMedio =
    scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
  const min = scores.length > 0 ? Math.min(...scores) : 0;
  const max = scores.length > 0 ? Math.max(...scores) : 0;
  const desvioMaximoPercentual =
    scoreMedio > 0 ? ((max - min) / scoreMedio) * 100 : 0;

  const desvios = workloads.map((w) => Math.abs(w.desvioPercentual));
  const scoreGlobalEquilibrio = Math.max(
    0,
    Math.round(100 - (desvios.length ? desvios.reduce((s, d) => s + d, 0) / desvios.length : 0)),
  );

  return {
    workloads,
    scoreMedio: Math.round(scoreMedio),
    desvioMaximoPercentual: Math.round(desvioMaximoPercentual * 10) / 10,
    scoreGlobalEquilibrio,
  };
}
