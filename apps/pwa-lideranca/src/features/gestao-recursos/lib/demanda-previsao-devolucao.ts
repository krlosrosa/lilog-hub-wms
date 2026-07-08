import { formatTimeFromIso } from '@/features/gestao-recursos/lib/pausa-utils';
import type {
  DemandaDevolucaoRecursoApi,
  DevolucaoAlocacaoEtapaApi,
} from '@/features/gestao-recursos/types/gestao-recursos.api';
import type { TaskItem } from '@/features/gestao-recursos/types/gestao-recursos.schema';

const ETAPA_LABELS: Record<DevolucaoAlocacaoEtapaApi, string> = {
  aguardando: 'Aguardando',
  checklist: 'Checklist',
  conferencia: 'Conferência',
  finalizacao: 'Finalização',
  concluida: 'Concluída',
};

const LATE_REPLAN_BUFFER_MS = 60_000;

export type DevolucaoTimelineResult = {
  tasks: TaskItem[];
  expectedEndTotal: Date | null;
  activeTaskStartTime: string | undefined;
  activeTaskProgress: number;
};

function findActiveAlocacaoIndex(
  alocacoes: DemandaDevolucaoRecursoApi[],
): number {
  const emExecucaoIndex = alocacoes.findIndex(
    (alocacao) => alocacao.status === 'em_execucao',
  );

  return emExecucaoIndex >= 0 ? emExecucaoIndex : 0;
}

export function computeDevolucaoTimeline(
  alocacoes: DemandaDevolucaoRecursoApi[],
  now = new Date(),
  pausaDeslocamentoMs = 0,
): DevolucaoTimelineResult {
  const sorted = [...alocacoes].sort(
    (a, b) =>
      new Date(a.atribuidoEm).getTime() - new Date(b.atribuidoEm).getTime(),
  );

  if (sorted.length === 0) {
    return {
      tasks: [],
      expectedEndTotal: null,
      activeTaskStartTime: undefined,
      activeTaskProgress: 0,
    };
  }

  const activeIndex = findActiveAlocacaoIndex(sorted);
  const activeAlocacao = sorted[activeIndex]!;
  const pausaNoAtivo =
    activeAlocacao.status === 'em_execucao' ? pausaDeslocamentoMs : 0;
  let cursorEnd: Date | null = null;
  let expectedEndTotal: Date | null = null;

  const tasks: TaskItem[] = sorted.map((alocacao, index) => {
    let start: Date;

    if (index === activeIndex && alocacao.inicioEm) {
      start = new Date(alocacao.inicioEm);
    } else if (index === 0) {
      start = new Date(alocacao.inicioEm ?? alocacao.atribuidoEm ?? now);
    } else {
      const previousEnd = cursorEnd ?? now;
      const anteriorAtrasado = now.getTime() > previousEnd.getTime();
      start = anteriorAtrasado
        ? new Date(now.getTime() + LATE_REPLAN_BUFFER_MS)
        : new Date(previousEnd);
    }

    const pausaExtraMs = index === activeIndex ? pausaNoAtivo : 0;
    const end = new Date(
      start.getTime() + alocacao.tempoEsperadoMinutos * 60_000 + pausaExtraMs,
    );
    cursorEnd = end;
    expectedEndTotal = end;

    const isActive = index === activeIndex;
    const etapaLabel = ETAPA_LABELS[alocacao.etapa];

    return {
      id: alocacao.id,
      processo: 'devolucao' as const,
      label: `${alocacao.codigoDemanda} · ${etapaLabel}`,
      startTime: formatTimeFromIso(start.toISOString()),
      expectedEndTime: formatTimeFromIso(end.toISOString()),
      estimatedSeconds: alocacao.tempoEsperadoMinutos * 60,
      pausaExtraMinutos:
        pausaExtraMs > 0 ? Math.ceil(pausaExtraMs / 60_000) : undefined,
      progress: isActive ? 0 : undefined,
      status: isActive ? 'em_andamento' : 'pendente',
      isLate: now.getTime() > end.getTime(),
    };
  });

  return {
    tasks,
    expectedEndTotal,
    activeTaskStartTime: activeAlocacao.inicioEm
      ? formatTimeFromIso(activeAlocacao.inicioEm)
      : tasks[activeIndex]?.startTime,
    activeTaskProgress: 0,
  };
}

export function getReferenciaOciosidadeDevolucaoIso(
  checkIn: string | null,
  alocacoes: DemandaDevolucaoRecursoApi[],
): string | null {
  if (alocacoes.length === 0) {
    return checkIn;
  }

  const ultima = [...alocacoes].sort(
    (a, b) =>
      new Date(b.atribuidoEm).getTime() - new Date(a.atribuidoEm).getTime(),
  )[0];

  return ultima?.inicioEm ?? ultima?.atribuidoEm ?? checkIn;
}
