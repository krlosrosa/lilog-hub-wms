import { formatTimeFromIso } from '@/features/pausas/lib/pausas-mappers';
import type {
  DemandaSeparacaoApi,
  DemandaSeparacaoStatusApi,
} from '@/features/gestao-recursos/types/gestao-recursos.api';
import type { TaskItem } from '@/features/gestao-recursos/types/gestao-recursos.schema';

const STATUS_ATIVO: DemandaSeparacaoStatusApi[] = ['pendente', 'em_andamento'];
const STATUS_PROGRESSO: DemandaSeparacaoStatusApi[] = [
  'pendente',
  'em_andamento',
  'concluida',
];
/** Margem após atraso antes de iniciar o próximo mapa na fila. */
const LATE_REPLAN_BUFFER_MS = 60_000;

export type ProgressoMapasResult = {
  progress: number;
  concluidas: number;
  total: number;
};

export type DemandaTimelineResult = {
  tasks: TaskItem[];
  expectedEndTotal: Date | null;
  activeTaskEnd: Date | null;
  activeTaskStartTime: string | undefined;
  activeTaskProgress: number;
  progressoMapas: ProgressoMapasResult;
};

export type DemandaTimelineOptions = {
  pausaDeslocamentoMs?: number;
};

export function computeProgressoMapas(
  demandas: DemandaSeparacaoApi[],
): ProgressoMapasResult {
  const relevantes = demandas.filter((demanda) =>
    STATUS_PROGRESSO.includes(demanda.status),
  );
  const total = relevantes.length;
  const concluidas = relevantes.filter(
    (demanda) => demanda.status === 'concluida',
  ).length;

  return {
    progress: total > 0 ? Math.round((concluidas / total) * 100) : 0,
    concluidas,
    total,
  };
}

export function sortDemandasAtivas(
  demandas: DemandaSeparacaoApi[],
): DemandaSeparacaoApi[] {
  return demandas
    .filter((demanda) => STATUS_ATIVO.includes(demanda.status))
    .sort(
      (a, b) =>
        new Date(a.atribuidoEm).getTime() - new Date(b.atribuidoEm).getTime(),
    );
}

function findActiveDemandaIndex(demandas: DemandaSeparacaoApi[]): number {
  const emAndamentoIndex = demandas.findIndex(
    (demanda) => demanda.status === 'em_andamento',
  );

  return emAndamentoIndex >= 0 ? emAndamentoIndex : 0;
}

export function computeDemandaTimeline(
  demandas: DemandaSeparacaoApi[],
  now = new Date(),
  options?: DemandaTimelineOptions,
): DemandaTimelineResult {
  const pausaDeslocamentoMs = options?.pausaDeslocamentoMs ?? 0;
  const progressoMapas = computeProgressoMapas(demandas);
  const sorted = sortDemandasAtivas(demandas);

  if (sorted.length === 0) {
    return {
      tasks: [],
      expectedEndTotal: null,
      activeTaskEnd: null,
      activeTaskStartTime: undefined,
      activeTaskProgress: progressoMapas.progress,
      progressoMapas,
    };
  }

  const activeIndex = findActiveDemandaIndex(sorted);
  const activeDemanda = sorted[activeIndex]!;
  const pausaNoMapaAtivo =
    activeDemanda.status === 'em_andamento' ? pausaDeslocamentoMs : 0;
  let cursorEnd: Date | null = null;
  let expectedEndTotal: Date | null = null;
  let activeTaskEnd: Date | null = null;

  const tasks: TaskItem[] = sorted.map((demanda, index) => {
    let start: Date;

    if (demanda.status === 'em_andamento' && demanda.iniciadoEm) {
      start = new Date(demanda.iniciadoEm);
    } else if (index === 0) {
      start = new Date(demanda.iniciadoEm ?? now);
    } else {
      const previousEnd = cursorEnd ?? now;
      const anteriorAtrasado = now.getTime() > previousEnd.getTime();

      start = anteriorAtrasado
        ? new Date(now.getTime() + LATE_REPLAN_BUFFER_MS)
        : new Date(previousEnd);
    }

    const pausaExtraMs = index === activeIndex ? pausaNoMapaAtivo : 0;
    const end = new Date(
      start.getTime() + demanda.tempoEsperadoMinutos * 1_000 + pausaExtraMs,
    );
    cursorEnd = end;
    expectedEndTotal = end;

    if (index === activeIndex) {
      activeTaskEnd = end;
    }

    const isActive = demanda.status === 'em_andamento' || index === activeIndex;
    const pausaExtraMinutos =
      pausaExtraMs > 0 ? Math.ceil(pausaExtraMs / 60_000) : undefined;

    return {
      id: demanda.id,
      mapaGrupoId: demanda.mapaGrupoId,
      processo: demanda.mapaGrupoProcesso,
      label: demanda.mapaGrupoTitulo,
      startTime: formatTimeFromIso(start.toISOString()),
      expectedEndTime: formatTimeFromIso(end.toISOString()),
      estimatedSeconds: demanda.tempoEsperadoMinutos,
      pausaExtraMinutos,
      progress: isActive ? 0 : undefined,
      status: isActive ? 'em_andamento' : 'pendente',
      isLate: now.getTime() > end.getTime(),
    };
  });

  return {
    tasks,
    expectedEndTotal,
    activeTaskEnd,
    activeTaskStartTime: activeDemanda.iniciadoEm
      ? formatTimeFromIso(activeDemanda.iniciadoEm)
      : tasks[activeIndex]?.startTime,
    activeTaskProgress: progressoMapas.progress,
    progressoMapas,
  };
}

export function isOperatorLate(
  activeTaskEnd: Date | null,
  now = new Date(),
): boolean {
  if (!activeTaskEnd) {
    return false;
  }

  return now.getTime() > activeTaskEnd.getTime();
}

function demandaFoiIniciada(demanda: DemandaSeparacaoApi): boolean {
  return (
    demanda.iniciadoEm != null ||
    demanda.status === 'em_andamento' ||
    demanda.status === 'concluida'
  );
}

export function getReferenciaOciosidadeIso(
  checkIn: string | null,
  demandas: DemandaSeparacaoApi[],
): string | null {
  const demandasIniciadas = demandas.filter(demandaFoiIniciada);

  if (demandasIniciadas.length === 0) {
    return checkIn;
  }

  const ultimaFinalizada = demandas
    .filter((demanda) => demanda.finalizadoEm != null)
    .sort(
      (a, b) =>
        new Date(b.finalizadoEm!).getTime() -
        new Date(a.finalizadoEm!).getTime(),
    )[0];

  return ultimaFinalizada?.finalizadoEm ?? checkIn;
}
