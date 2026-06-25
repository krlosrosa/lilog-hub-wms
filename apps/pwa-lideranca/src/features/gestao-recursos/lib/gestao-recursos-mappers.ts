import {
  computeDemandaTimeline,
  getReferenciaOciosidadeIso,
  isOperatorLate,
} from '@/features/gestao-recursos/lib/demanda-previsao';
import {
  computePausaAtivaDeslocamentoMs,
  formatDurationMinutes,
  formatTimeFromIso,
  getElapsedMinutes,
  getPausaMonitorInfo,
} from '@/features/gestao-recursos/lib/pausa-utils';
import type {
  DemandaSeparacaoApi,
  ProximaPausaApi,
  RecursosSessaoApiResponse,
  SessaoPausaTipoApi,
} from '@/features/gestao-recursos/types/gestao-recursos.api';
import type {
  KpiCard,
  Operator,
} from '@/features/gestao-recursos/types/gestao-recursos.schema';

const IDLE_THRESHOLD_BASE = 30;

function enrichProximaPausa(
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

function withProximaPausa<T extends Operator>(
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
    expectedEnd: timeline.activeTaskEnd
      ? formatTimeFromIso(timeline.activeTaskEnd.toISOString())
      : undefined,
    isLate: isOperatorLate(timeline.activeTaskEnd, now),
    tasks: timeline.tasks,
  };
}

function buildPauseFields(
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

      return buildOperadorEmPausa(
        operatorId,
        funcionario.nome,
        sector,
        funcionario.pausaAtiva.inicio,
        funcionario.pausaAtiva.tipo,
        demandasOperador,
        now,
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
      return withProximaPausa(
        buildOperatorFromDemandas(
          operatorId,
          funcionario.nome,
          sector,
          demandasOperador,
          now,
        ),
        proxima,
      );
    }

    return withProximaPausa(
      buildOperadorOcioso(
        operatorId,
        funcionario.nome,
        sector,
        funcionario.checkIn,
        demandasOperador,
        now,
      ),
      proxima,
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
