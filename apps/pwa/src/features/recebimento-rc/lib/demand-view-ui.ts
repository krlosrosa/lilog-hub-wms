import type { DemandView } from '@lilog/contracts';

import type { ChecklistRecord } from '@/features/recebimento-v2/local-db/schema';

export type StatusFilter = 'all' | 'priority' | 'working' | 'ready';

export type DemandDisplayStatus = {
  situacao: string;
  label: string;
  pulse: boolean;
  isPendingSync: boolean;
};

type DemandChecklistFlags = Pick<
  ChecklistRecord,
  | 'localFinalizationAttempted'
  | 'pendingFinalizationSync'
  | 'finalizacaoPayload'
  | 'finalizationServerConfirmed'
>;

export function resolveDemandDisplayStatus(
  demanda: Pick<DemandView, 'situacao'>,
  localChecklist?: DemandChecklistFlags,
  options?: {
    serverSituacao?: string | null;
    serverIsConferido?: boolean;
  },
): DemandDisplayStatus {
  const hasLocalFinalizationAttempt = Boolean(
    localChecklist?.localFinalizationAttempted ||
      localChecklist?.pendingFinalizationSync ||
      localChecklist?.finalizacaoPayload,
  );
  const isServerFinalizationConfirmed = Boolean(
    localChecklist?.finalizationServerConfirmed,
  );
  const needsFinalizationSync = Boolean(
    localChecklist?.pendingFinalizationSync ||
      (hasLocalFinalizationAttempt &&
        !isServerFinalizationConfirmed &&
        localChecklist?.finalizacaoPayload),
  );

  const serverIsConferido =
    options?.serverIsConferido ??
    (options?.serverSituacao != null ? options.serverSituacao === 'conferido' : undefined);

  if (serverIsConferido === true && !needsFinalizationSync) {
    return {
      situacao: 'conferido',
      label: 'Conferido',
      pulse: false,
      isPendingSync: false,
    };
  }

  if (
    demanda.situacao === 'conferido' &&
    options?.serverSituacao &&
    serverIsConferido === false
  ) {
    return {
      situacao: 'em_conferencia',
      label: 'Não sincronizado',
      pulse: true,
      isPendingSync: true,
    };
  }

  if (
    demanda.situacao === 'conferido' &&
    (needsFinalizationSync ||
      (hasLocalFinalizationAttempt && !isServerFinalizationConfirmed))
  ) {
    return {
      situacao: 'em_conferencia',
      label: needsFinalizationSync ? 'Aguardando sync' : 'Conferindo',
      pulse: true,
      isPendingSync: needsFinalizationSync,
    };
  }

  return {
    situacao: demanda.situacao,
    label: getDemandStatusLabel(demanda.situacao),
    pulse: demanda.situacao === 'em_conferencia',
    isPendingSync: false,
  };
}

export function formatArrival(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatDockLabel(dock: string | null | undefined): string {
  if (!dock?.trim()) return '—';
  const trimmed = dock.trim();
  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed.startsWith('Doca') ? trimmed.replace(/^Doca\s*/i, '') : trimmed;
}

export function getDemandStatusLabel(situacao: string): string {
  switch (situacao) {
    case 'liberado_para_conferencia':
      return 'Pronto';
    case 'em_conferencia':
      return 'Conferindo';
    case 'impedido':
      return 'Impedido';
    case 'conferido':
      return 'Conferido';
    case 'finalizado':
      return 'Finalizado';
    case 'aguardando':
      return 'Aguardando';
    case 'agendado':
      return 'Agendado';
    default:
      return 'Aguardando';
  }
}

export function isLateDemand(demanda: DemandView): boolean {
  if (demanda.situacao !== 'liberado_para_conferencia') {
    return false;
  }

  const scheduledAt = new Date(demanda.horarioPrevisto).getTime();
  return Number.isFinite(scheduledAt) && scheduledAt < Date.now();
}

export function isPriorityDemand(demanda: DemandView): boolean {
  return demanda.situacao === 'impedido' || isLateDemand(demanda);
}

export function isWorkingDemand(demanda: DemandView): boolean {
  return demanda.situacao === 'em_conferencia';
}

export function isReadyDemand(demanda: DemandView): boolean {
  return (
    demanda.situacao === 'liberado_para_conferencia' ||
    demanda.situacao === 'em_conferencia'
  );
}

export function matchesStatusFilter(demanda: DemandView, filter: StatusFilter): boolean {
  switch (filter) {
    case 'priority':
      return isPriorityDemand(demanda);
    case 'working':
      return isWorkingDemand(demanda);
    case 'ready':
      return isReadyDemand(demanda);
    default:
      return true;
  }
}

export function matchesSearchQuery(demanda: DemandView, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  const fields = [
    demanda.preRecebimentoId,
    demanda.placa,
    demanda.transportadoraNome,
    demanda.dock,
    demanda.conferente,
  ];

  return fields.some((value) => (value ?? '').toLowerCase().includes(normalized));
}

export function sortDemandasByHorario(demandas: DemandView[]): DemandView[] {
  return [...demandas].sort((a, b) => {
    const aTime = new Date(a.horarioPrevisto).getTime();
    const bTime = new Date(b.horarioPrevisto).getTime();
    return bTime - aTime;
  });
}
