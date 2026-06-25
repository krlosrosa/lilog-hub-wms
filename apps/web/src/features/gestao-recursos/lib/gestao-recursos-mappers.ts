import {
  formatDurationMinutes,
  formatTimeFromIso,
  getElapsedMinutes,
  getPausaMonitorInfo,
} from '@/features/pausas/lib/pausas-mappers';
import type { FuncionarioPausasData } from '@/features/pausas/lib/pausas-data';
import { computePausaAtivaDeslocamentoMs } from '@/features/pausas/lib/pausa-previsao';
import type { SessaoPausaTipoApi } from '@/features/pausas/types/pausas.api';
import type { SessaoFuncionarioApi } from '@/features/sessao-operacao/types/sessao.api';
import {
  computeDemandaTimeline,
  getReferenciaOciosidadeIso,
  isOperatorLate,
} from '@/features/gestao-recursos/lib/demanda-previsao';
import type {
  DemandaSeparacaoApi,
  ProximaPausaApi,
  RecursosSessaoApiResponse,
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

function mapFuncionarioToOperator(
  funcionario: SessaoFuncionarioApi,
  pausasData: FuncionarioPausasData | undefined,
  demandas: DemandaSeparacaoApi[],
  now: Date,
): Operator {
  const operatorId = funcionario.id;
  const sector = funcionario.cargo || 'Operação';

  if (pausasData?.pausas.emPausaAgora) {
    const demandasOperador = demandas.filter(
      (d) =>
        d.sessaoFuncionarioId === operatorId &&
        (d.status === 'pendente' ||
          d.status === 'em_andamento' ||
          d.status === 'concluida'),
    );

    return buildOperadorEmPausa(
      operatorId,
      funcionario.nome,
      sector,
      pausasData.pausas.emPausaAgora.inicio,
      pausasData.pausas.emPausaAgora.tipo,
      demandasOperador,
      now,
    );
  }

  const demandasOperador = demandas.filter(
    (d) =>
      d.sessaoFuncionarioId === operatorId &&
      (d.status === 'pendente' ||
        d.status === 'em_andamento' ||
        d.status === 'concluida'),
  );
  const demandasAtivas = demandasOperador.filter(
    (d) => d.status === 'pendente' || d.status === 'em_andamento',
  );

  if (demandasAtivas.length > 0) {
    return buildOperatorFromDemandas(
      operatorId,
      funcionario.nome,
      sector,
      demandasOperador,
      now,
    );
  }

  return buildOperadorOcioso(
    operatorId,
    funcionario.nome,
    sector,
    funcionario.checkIn,
    demandasOperador,
    now,
  );
}

export function mapRecursosSessaoToOperators(
  funcionariosPausas: FuncionarioPausasData[],
  demandas: DemandaSeparacaoApi[] = [],
  now = new Date(),
): Operator[] {
  const demandasPorSessaoFuncionario = new Map<string, DemandaSeparacaoApi[]>();

  for (const demanda of demandas) {
    const list =
      demandasPorSessaoFuncionario.get(demanda.sessaoFuncionarioId) ?? [];
    list.push(demanda);
    demandasPorSessaoFuncionario.set(demanda.sessaoFuncionarioId, list);
  }

  return funcionariosPausas.map(({ funcionario, pausas }) =>
    mapFuncionarioToOperator(
      funcionario,
      { funcionario, pausas },
      demandasPorSessaoFuncionario.get(funcionario.id) ?? [],
      now,
    ),
  );
}

export function computeKpisFromOperators(
  operators: Operator[],
  totalFuncionarios: number,
): KpiCard[] {
  const atuando = operators.filter((o) => o.status === 'atuando').length;
  const ociosos = operators.filter((o) => o.status === 'ocioso').length;
  const emPausa = operators.filter((o) => o.emPausa).length;
  const precisamPausa = operators.filter((o) => o.precisaPausa && !o.emPausa).length;

  return [
    {
      id: 'total-operadores',
      label: 'Total de Operadores',
      value: String(operators.length),
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
      footer: precisamPausa > 0 ? 'REGISTRAR PAUSA RECOMENDADO' : undefined,
      accent: 'warning',
    },
    {
      id: 'ociosidade-critica',
      label: 'Ociosos',
      value: String(ociosos).padStart(2, '0'),
      suffix: 'SEM MISSÃO',
      footer: ociosos > 0 ? 'INTERVENÇÃO RECOMENDADA' : undefined,
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
