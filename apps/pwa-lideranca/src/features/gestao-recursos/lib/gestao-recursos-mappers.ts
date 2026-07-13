import {
  computeDemandaTimeline,
  getReferenciaOciosidadeIso,
  isOperatorLate,
} from '@/features/gestao-recursos/lib/demanda-previsao';
import { withApoioFields } from '@/features/gestao-recursos/lib/apoio-fields';
import {
  computeDevolucaoTimeline,
  getReferenciaOciosidadeDevolucaoIso,
} from '@/features/gestao-recursos/lib/demanda-previsao-devolucao';
import {
  computePausaAtivaDeslocamentoMs,
  formatDurationMinutes,
  formatTimeFromIso,
  getElapsedMinutes,
  getPausaMonitorInfo,
} from '@/features/gestao-recursos/lib/pausa-utils';
import type {
  DemandaDevolucaoRecursoApi,
  DemandaSeparacaoApi,
  ProximaPausaApi,
  RecursosDevolucaoSessaoApiResponse,
  RecursosSessaoApiResponse,
  SessaoPausaTipoApi,
} from '@/features/gestao-recursos/types/gestao-recursos.api';
import type {
  KpiCard,
  Operator,
  OperatorStatus,
} from '@/features/gestao-recursos/types/gestao-recursos.schema';

const IDLE_THRESHOLD_BASE = 30;

export function enrichProximaPausa(
  proxima: ProximaPausaApi | null | undefined,
  now: Date,
): ProximaPausaApi | null {
  if (!proxima) {
    return null;
  }

  const tempoTrabalhoContinuoMinutos = getElapsedMinutes(
    proxima.referenciaTrabalhoIso,
    now,
  );
  const intervalo = proxima.intervaloReferenciaMinutos;
  const precisaPausa =
    intervalo > 0 && tempoTrabalhoContinuoMinutos >= intervalo;
  const atrasoMinutos = precisaPausa
    ? Math.max(0, tempoTrabalhoContinuoMinutos - intervalo)
    : 0;
  const tempoRestanteMinutos = precisaPausa
    ? 0
    : Math.max(0, intervalo - tempoTrabalhoContinuoMinutos);

  return {
    ...proxima,
    precisaPausa,
    tempoTrabalhoContinuoMinutos,
    atrasoMinutos,
    tempoRestanteMinutos,
  };
}

function mapProximaPausaToOperatorFields(proxima: ProximaPausaApi | null) {
  if (!proxima) {
    return {};
  }

  const pausaDevidaProgress = Math.min(
    100,
    Math.round(
      (proxima.tempoTrabalhoContinuoMinutos /
        proxima.intervaloReferenciaMinutos) *
        100,
    ),
  );

  return {
    pausaTipoSugerido: proxima.tipoSugerido,
    tempoTrabalhoContinuoMinutos: proxima.tempoTrabalhoContinuoMinutos,
    intervaloPausaReferenciaMinutos: proxima.intervaloReferenciaMinutos,
    duracaoPausaSugeridaMinutos: proxima.duracaoPausaMinutos,
    pausaTempoRestanteMinutos: proxima.tempoRestanteMinutos,
    pausaDevidaProgress,
    ...(proxima.precisaPausa
      ? {
          precisaPausa: true as const,
          pausaAtrasoMinutos: proxima.atrasoMinutos,
        }
      : {}),
  };
}

export function withProximaPausa<T extends Operator>(
  operator: T,
  proxima: ProximaPausaApi | null,
): T {
  return {
    ...operator,
    ...mapProximaPausaToOperatorFields(proxima),
  };
}

function buildOperadorOcioso(
  operatorId: string,
  name: string,
  sector: string,
  checkIn: string | null,
  demandasOperador: DemandaSeparacaoApi[],
  now: Date,
): Operator {
  const referenciaOciosidade = getReferenciaOciosidadeIso(
    checkIn,
    demandasOperador,
  );
  const idleElapsed = referenciaOciosidade
    ? getElapsedMinutes(referenciaOciosidade, now)
    : 0;
  const idleThreshold = Math.min(
    100,
    Math.round((idleElapsed / 60) * IDLE_THRESHOLD_BASE),
  );

  return {
    id: operatorId,
    name,
    sector,
    status: 'ocioso',
    idleDuration: `${formatDurationMinutes(idleElapsed).toUpperCase()} OCIOSO`,
    idleThreshold: idleThreshold || 5,
  };
}

function buildOperatorFromDemandas(
  operatorId: string,
  name: string,
  sector: string,
  demandas: DemandaSeparacaoApi[],
  now: Date,
  pausaDeslocamentoMs = 0,
): Operator {
  const timeline = computeDemandaTimeline(demandas, now, {
    pausaDeslocamentoMs,
  });
  const activeTask =
    timeline.tasks.find((task) => task.status === 'em_andamento') ??
    timeline.tasks[0];

  return {
    id: operatorId,
    name,
    sector,
    status: 'atuando',
    currentMission: activeTask?.label,
    startTime: timeline.activeTaskStartTime,
    progress: timeline.activeTaskProgress,
    expectedEnd: timeline.expectedEndTotal
      ? formatTimeFromIso(timeline.expectedEndTotal.toISOString())
      : undefined,
    isLate: isOperatorLate(timeline.expectedEndTotal, now),
    tasks: timeline.tasks,
  };
}

export function buildPauseFields(
  pausaInicio: string,
  pausaTipo: SessaoPausaTipoApi,
  now: Date,
) {
  const pauseInfo = getPausaMonitorInfo(pausaInicio, pausaTipo, now);
  const pauseThreshold =
    pauseInfo.limiteMinutos != null
      ? Math.min(
          100,
          Math.round((pauseInfo.elapsed / pauseInfo.limiteMinutos) * 100),
        )
      : Math.min(
          100,
          Math.round((pauseInfo.elapsed / 20) * IDLE_THRESHOLD_BASE),
        );

  return {
    emPausa: true as const,
    pauseDuration: `${formatDurationMinutes(pauseInfo.elapsed).toUpperCase()} EM PAUSA`,
    pauseThreshold: pauseThreshold || 5,
    pauseTipo: pausaTipo,
    pausePrevisaoRetorno: pauseInfo.previsaoRetorno,
    pauseStatus: pauseInfo.status,
    pauseTempoRestante: pauseInfo.tempoRestante,
    isPauseOverPlanned: pauseInfo.status === 'atrasado',
    pauseAtrasoRetornoMinutos:
      pauseInfo.status === 'atrasado' && pauseInfo.limiteMinutos != null
        ? pauseInfo.elapsed - pauseInfo.limiteMinutos
        : undefined,
    pauseElapsedMinutos: pauseInfo.elapsed,
  };
}

export function compareOperadoresEmPausa(a: Operator, b: Operator): number {
  if (a.isPauseOverPlanned !== b.isPauseOverPlanned) {
    return a.isPauseOverPlanned ? -1 : 1;
  }

  const elapsedA = a.pauseElapsedMinutos ?? 0;
  const elapsedB = b.pauseElapsedMinutos ?? 0;

  if (elapsedB !== elapsedA) {
    return elapsedB - elapsedA;
  }

  return a.name.localeCompare(b.name, 'pt-BR');
}

function buildOperadorEmPausa(
  operatorId: string,
  name: string,
  sector: string,
  pausaInicio: string,
  pausaTipo: SessaoPausaTipoApi,
  demandasOperador: DemandaSeparacaoApi[],
  now: Date,
): Operator {
  const pauseFields = buildPauseFields(pausaInicio, pausaTipo, now);

  const demandasAtivas = demandasOperador.filter(
    (d) => d.status === 'pendente' || d.status === 'em_andamento',
  );

  if (demandasAtivas.length === 0) {
    return {
      id: operatorId,
      name,
      sector,
      status: 'pausa',
      ...pauseFields,
    };
  }

  const pausaMs = computePausaAtivaDeslocamentoMs(pausaInicio, now);
  const base = buildOperatorFromDemandas(
    operatorId,
    name,
    sector,
    demandasOperador,
    now,
    pausaMs,
  );

  return {
    ...base,
    status: 'atuando',
    ...pauseFields,
  };
}

export function mapApiRecursosToOperators(
  response: RecursosSessaoApiResponse,
  now = new Date(),
): { operators: Operator[]; kpis: KpiCard[] } {
  const demandasPorSessaoFuncionario = new Map<string, DemandaSeparacaoApi[]>();

  for (const demanda of response.demandas) {
    const list =
      demandasPorSessaoFuncionario.get(demanda.sessaoFuncionarioId) ?? [];
    list.push(demanda);
    demandasPorSessaoFuncionario.set(demanda.sessaoFuncionarioId, list);
  }

  const operators: Operator[] = response.funcionarios.map((funcionario) => {
    const operatorId = funcionario.id;
    const sector = funcionario.cargo || 'Operação';
    const proxima = enrichProximaPausa(funcionario.proximaPausa, now);

    if (funcionario.pausaAtiva) {
      const demandasOperador = (
        demandasPorSessaoFuncionario.get(funcionario.id) ?? []
      ).filter(
        (d) =>
          d.status === 'pendente' ||
          d.status === 'em_andamento' ||
          d.status === 'concluida',
      );

      return withApoioFields(
        buildOperadorEmPausa(
          operatorId,
          funcionario.nome,
          sector,
          funcionario.pausaAtiva.inicio,
          funcionario.pausaAtiva.tipo,
          demandasOperador,
          now,
        ),
        funcionario,
      );
    }

    const demandasOperador = (
      demandasPorSessaoFuncionario.get(funcionario.id) ?? []
    ).filter(
      (d) =>
        d.status === 'pendente' ||
        d.status === 'em_andamento' ||
        d.status === 'concluida',
    );
    const demandasAtivas = demandasOperador.filter(
      (d) => d.status === 'pendente' || d.status === 'em_andamento',
    );

    if (demandasAtivas.length > 0) {
      return withApoioFields(
        withProximaPausa(
          buildOperatorFromDemandas(
            operatorId,
            funcionario.nome,
            sector,
            demandasOperador,
            now,
          ),
          proxima,
        ),
        funcionario,
      );
    }

    return withApoioFields(
      withProximaPausa(
        buildOperadorOcioso(
          operatorId,
          funcionario.nome,
          sector,
          funcionario.checkIn,
          demandasOperador,
          now,
        ),
        proxima,
      ),
      funcionario,
    );
  });

  const kpisFromApi = response.kpis.map((kpi) => ({
    id: kpi.id,
    label: kpi.label,
    value: kpi.value,
    suffix: kpi.suffix,
    progress: kpi.progress,
    footer: kpi.footer,
    accent: kpi.accent,
  }));

  const precisamPausaCount = operators.filter(
    (o) => o.precisaPausa && !o.emPausa,
  ).length;

  const kpis = kpisFromApi.map((kpi) =>
    kpi.id === 'precisam-pausa'
      ? {
          ...kpi,
          value: String(precisamPausaCount).padStart(2, '0'),
          footer:
            precisamPausaCount > 0 ? 'REGISTRAR PAUSA RECOMENDADO' : undefined,
        }
      : kpi,
  );

  return {
    operators,
    kpis,
  };
}

export function sortOperadoresParaLider(operators: Operator[]): Operator[] {
  return [...operators].sort((a, b) => {
    const scoreA = getOperadorPrioridade(a);
    const scoreB = getOperadorPrioridade(b);

    if (scoreA !== scoreB) {
      return scoreA - scoreB;
    }

    const atrasoA = a.pausaAtrasoMinutos ?? 0;
    const atrasoB = b.pausaAtrasoMinutos ?? 0;

    if (atrasoB !== atrasoA) {
      return atrasoB - atrasoA;
    }

    return a.name.localeCompare(b.name, 'pt-BR');
  });
}

function getOperadorPrioridade(operator: Operator): number {
  if (operator.precisaPausa && !operator.emPausa) {
    return 0;
  }
  if (operator.emPausa) {
    return 1;
  }
  if (operator.status === 'atuando') {
    return 2;
  }
  return 3;
}

function buildOperatorFromDevolucaoAlocacoes(
  operatorId: string,
  name: string,
  sector: string,
  alocacoes: DemandaDevolucaoRecursoApi[],
  now: Date,
  pausaDeslocamentoMs = 0,
): Operator {
  const timeline = computeDevolucaoTimeline(alocacoes, now, pausaDeslocamentoMs);
  const activeTask =
    timeline.tasks.find((task) => task.status === 'em_andamento') ??
    timeline.tasks[0];

  return {
    id: operatorId,
    name,
    sector,
    status: 'atuando',
    currentMission: activeTask?.label,
    startTime: timeline.activeTaskStartTime,
    progress: timeline.activeTaskProgress,
    expectedEnd: timeline.expectedEndTotal
      ? formatTimeFromIso(timeline.expectedEndTotal.toISOString())
      : undefined,
    isLate: isOperatorLate(timeline.expectedEndTotal, now),
    tasks: timeline.tasks,
  };
}

function buildOperadorOciosoDevolucao(
  operatorId: string,
  name: string,
  sector: string,
  checkIn: string | null,
  alocacoes: DemandaDevolucaoRecursoApi[],
  now: Date,
): Operator {
  const referenciaOciosidade = getReferenciaOciosidadeDevolucaoIso(
    checkIn,
    alocacoes,
  );
  const idleElapsed = referenciaOciosidade
    ? getElapsedMinutes(referenciaOciosidade, now)
    : 0;
  const idleThreshold = Math.min(
    100,
    Math.round((idleElapsed / 60) * IDLE_THRESHOLD_BASE),
  );

  return {
    id: operatorId,
    name,
    sector,
    status: 'ocioso',
    idleDuration: `${formatDurationMinutes(idleElapsed).toUpperCase()} OCIOSO`,
    idleThreshold: idleThreshold || 5,
  };
}

function buildOperadorEmPausaDevolucao(
  operatorId: string,
  name: string,
  sector: string,
  pausaInicio: string,
  pausaTipo: SessaoPausaTipoApi,
  alocacoes: DemandaDevolucaoRecursoApi[],
  now: Date,
): Operator {
  const pauseFields = buildPauseFields(pausaInicio, pausaTipo, now);

  if (alocacoes.length === 0) {
    return {
      id: operatorId,
      name,
      sector,
      status: 'pausa',
      ...pauseFields,
    };
  }

  const pausaMs = computePausaAtivaDeslocamentoMs(pausaInicio, now);
  const base = buildOperatorFromDevolucaoAlocacoes(
    operatorId,
    name,
    sector,
    alocacoes,
    now,
    pausaMs,
  );

  return {
    ...base,
    status: 'atuando',
    ...pauseFields,
  };
}

export function mapRecursosDevolucaoToOperators(
  response: RecursosDevolucaoSessaoApiResponse,
  now = new Date(),
): { operators: Operator[]; kpis: KpiCard[] } {
  const alocacoesPorSessaoFuncionario = new Map<
    string,
    DemandaDevolucaoRecursoApi[]
  >();

  for (const alocacao of response.alocacoes) {
    const list =
      alocacoesPorSessaoFuncionario.get(alocacao.sessaoFuncionarioId) ?? [];
    list.push(alocacao);
    alocacoesPorSessaoFuncionario.set(alocacao.sessaoFuncionarioId, list);
  }

  const operators: Operator[] = response.funcionarios.map((funcionario) => {
    const operatorId = funcionario.id;
    const sector = funcionario.cargo || 'Devolução';
    const proxima = enrichProximaPausa(funcionario.proximaPausa, now);
    const alocacoes = alocacoesPorSessaoFuncionario.get(funcionario.id) ?? [];

    if (funcionario.pausaAtiva) {
      return withApoioFields(
        buildOperadorEmPausaDevolucao(
          operatorId,
          funcionario.nome,
          sector,
          funcionario.pausaAtiva.inicio,
          funcionario.pausaAtiva.tipo,
          alocacoes,
          now,
        ),
        funcionario,
      );
    }

    if (alocacoes.length > 0) {
      return withApoioFields(
        withProximaPausa(
          buildOperatorFromDevolucaoAlocacoes(
            operatorId,
            funcionario.nome,
            sector,
            alocacoes,
            now,
          ),
          proxima,
        ),
        funcionario,
      );
    }

    return withApoioFields(
      withProximaPausa(
        buildOperadorOciosoDevolucao(
          operatorId,
          funcionario.nome,
          sector,
          funcionario.checkIn,
          alocacoes,
          now,
        ),
        proxima,
      ),
      funcionario,
    );
  });

  return {
    operators,
    kpis: recomputeKpisFromOperators(operators, response.funcionarios.length),
  };
}

function resolveMergedOperatorStatus(
  operacional: Operator,
  devolucao: Operator,
  emPausa: boolean,
): OperatorStatus {
  if (operacional.status === 'atuando' || devolucao.status === 'atuando') {
    return 'atuando';
  }

  if (emPausa) {
    return 'pausa';
  }

  return 'ocioso';
}

function mergeOperatorPair(operacional: Operator, devolucao: Operator): Operator {
  const emPausa = Boolean(operacional.emPausa || devolucao.emPausa);
  const pauseSource = operacional.emPausa ? operacional : devolucao;
  const primary =
    operacional.status === 'atuando'
      ? operacional
      : devolucao.status === 'atuando'
        ? devolucao
        : operacional;
  const secondary = primary === operacional ? devolucao : operacional;
  const combinedTasks = [
    ...(operacional.tasks ?? []),
    ...(devolucao.tasks ?? []),
  ];

  return {
    ...primary,
    status: resolveMergedOperatorStatus(operacional, devolucao, emPausa),
    sector:
      operacional.sector === devolucao.sector
        ? operacional.sector
        : `${operacional.sector} · Devolução`,
    tasks: combinedTasks.length > 0 ? combinedTasks : undefined,
    currentMission: primary.currentMission ?? secondary.currentMission,
    startTime: primary.startTime ?? secondary.startTime,
    progress: primary.progress ?? secondary.progress,
    expectedEnd: primary.expectedEnd ?? secondary.expectedEnd,
    isLate: Boolean(primary.isLate || secondary.isLate),
    emPausa,
    precisaPausa: Boolean(operacional.precisaPausa || devolucao.precisaPausa),
    pausaAtrasoMinutos: Math.max(
      operacional.pausaAtrasoMinutos ?? 0,
      devolucao.pausaAtrasoMinutos ?? 0,
    ),
    pausaTipoSugerido:
      operacional.pausaTipoSugerido ?? devolucao.pausaTipoSugerido,
    tempoTrabalhoContinuoMinutos: Math.max(
      operacional.tempoTrabalhoContinuoMinutos ?? 0,
      devolucao.tempoTrabalhoContinuoMinutos ?? 0,
    ),
    intervaloPausaReferenciaMinutos:
      operacional.intervaloPausaReferenciaMinutos ??
      devolucao.intervaloPausaReferenciaMinutos,
    duracaoPausaSugeridaMinutos:
      operacional.duracaoPausaSugeridaMinutos ??
      devolucao.duracaoPausaSugeridaMinutos,
    pausaTempoRestanteMinutos: Math.min(
      operacional.pausaTempoRestanteMinutos ?? Number.MAX_SAFE_INTEGER,
      devolucao.pausaTempoRestanteMinutos ?? Number.MAX_SAFE_INTEGER,
    ),
    pausaDevidaProgress: Math.max(
      operacional.pausaDevidaProgress ?? 0,
      devolucao.pausaDevidaProgress ?? 0,
    ),
    pauseDuration: emPausa ? pauseSource.pauseDuration : undefined,
    pauseThreshold: emPausa ? pauseSource.pauseThreshold : undefined,
    pauseTipo: emPausa ? pauseSource.pauseTipo : undefined,
    pausePrevisaoRetorno: emPausa
      ? pauseSource.pausePrevisaoRetorno
      : undefined,
    pauseStatus: emPausa ? pauseSource.pauseStatus : undefined,
    pauseTempoRestante: emPausa ? pauseSource.pauseTempoRestante : undefined,
    isPauseOverPlanned: emPausa ? pauseSource.isPauseOverPlanned : undefined,
    pauseAtrasoRetornoMinutos: emPausa
      ? pauseSource.pauseAtrasoRetornoMinutos
      : undefined,
    pauseElapsedMinutos: emPausa ? pauseSource.pauseElapsedMinutos : undefined,
    idleDuration:
      primary.status === 'ocioso' && secondary.status === 'ocioso'
        ? primary.idleDuration
        : undefined,
    idleThreshold:
      primary.status === 'ocioso' && secondary.status === 'ocioso'
        ? primary.idleThreshold
        : undefined,
  };
}

export function mergeOperadoresRecursos(
  operacional: Operator[],
  devolucao: Operator[],
): Operator[] {
  const byId = new Map<string, Operator>();

  for (const operator of operacional) {
    byId.set(operator.id, operator);
  }

  for (const operator of devolucao) {
    const existing = byId.get(operator.id);

    if (!existing) {
      byId.set(operator.id, operator);
      continue;
    }

    byId.set(operator.id, mergeOperatorPair(existing, operator));
  }

  return Array.from(byId.values());
}

export function recomputeKpisFromOperators(
  operators: Operator[],
  totalFuncionarios: number,
): KpiCard[] {
  const atuando = operators.filter((operator) => operator.status === 'atuando')
    .length;
  const ociosos = operators.filter((operator) => operator.status === 'ocioso')
    .length;
  const emPausa = operators.filter((operator) => operator.emPausa).length;
  const precisamPausa = operators.filter(
    (operator) => operator.precisaPausa && !operator.emPausa,
  ).length;

  return [
    {
      id: 'total-operadores',
      label: 'Total de Operadores',
      value: String(operators.length).padStart(2, '0'),
      suffix: `/ ${totalFuncionarios} na sessão`,
      progress:
        totalFuncionarios > 0
          ? Math.round((operators.length / totalFuncionarios) * 100)
          : 0,
      accent: 'primary',
    },
    {
      id: 'atuando',
      label: 'Atuando',
      value: String(atuando).padStart(2, '0'),
      suffix: 'COM DEMANDA',
      accent: 'tertiary',
    },
    {
      id: 'precisam-pausa',
      label: 'Precisam pausa',
      value: String(precisamPausa).padStart(2, '0'),
      suffix: 'ORIENTAR',
      footer:
        precisamPausa > 0 ? 'REGISTRAR PAUSA RECOMENDADO' : undefined,
      accent: 'warning',
    },
    {
      id: 'ociosidade-critica',
      label: 'Ociosos',
      value: String(ociosos).padStart(2, '0'),
      suffix: 'SEM MISSÃO',
      accent: 'destructive',
    },
    {
      id: 'em-pausa',
      label: 'Em Pausa',
      value: String(emPausa).padStart(2, '0'),
      suffix: 'AGORA',
      accent: 'muted',
    },
  ];
}
