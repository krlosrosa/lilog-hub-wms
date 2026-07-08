'use client';

import { cn } from '@lilog/ui';

import type { ConferenceItemStatus } from '@/features/devolucao/types/devolucao-detalhes.schema';
import { CONFERENCE_STATUS_LABELS } from '@/features/devolucao/types/devolucao-detalhes.schema';
import type { DemandaDevolucaoStatus } from '@/features/devolucao/types/devolucao-gestao.schema';
import { DEMANDA_DEVOLUCAO_STATUS_LABELS } from '@/features/devolucao/types/devolucao-gestao.schema';
import type { NfItemStatus } from '@/features/devolucao/types/devolucao-checkin.schema';
import { NF_ITEM_STATUS_LABELS } from '@/features/devolucao/types/devolucao-checkin.schema';

type DevolucaoStatusBadgeProps = {
  status: DemandaDevolucaoStatus;
  compact?: boolean;
  className?: string;
};

const STATUS_STYLES: Record<
  DemandaDevolucaoStatus,
  { dot: string; text: string; pulse?: boolean }
> = {
  rascunho: {
    dot: 'bg-muted-foreground',
    text: 'text-muted-foreground',
  },
  aberta: {
    dot: 'bg-primary',
    text: 'text-primary',
    pulse: true,
  },
  em_analise: {
    dot: 'bg-secondary',
    text: 'text-secondary',
    pulse: true,
  },
  em_execucao: {
    dot: 'bg-tertiary',
    text: 'text-tertiary',
    pulse: true,
  },
  conferida: {
    dot: 'bg-tertiary',
    text: 'text-tertiary',
  },
  concluida: {
    dot: 'bg-muted-foreground',
    text: 'text-muted-foreground',
  },
  cancelada: {
    dot: 'bg-destructive',
    text: 'text-destructive',
  },
};

const COMPACT_STATUS_LABELS: Record<DemandaDevolucaoStatus, string> = {
  rascunho: 'Rascunho',
  aberta: 'Aberta',
  em_analise: 'Aguard. Conf.',
  em_execucao: 'Em Conf.',
  conferida: 'Conferido',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

export function DevolucaoStatusBadge({
  status,
  compact = false,
  className,
}: DevolucaoStatusBadgeProps) {
  const styles = STATUS_STYLES[status];
  const label = compact
    ? COMPACT_STATUS_LABELS[status]
    : DEMANDA_DEVOLUCAO_STATUS_LABELS[status];

  return (
    <div
      className={cn(
        'flex items-center',
        compact ? 'gap-1' : 'gap-2',
        styles.text,
        className,
      )}
    >
      {status !== 'concluida' && status !== 'cancelada' && status !== 'rascunho' && (
        <span
          className={cn(
            'rounded-full',
            compact ? 'size-1' : 'size-1.5',
            styles.dot,
            styles.pulse && 'animate-pulse',
          )}
          aria-hidden
        />
      )}
      <span
        className={cn(
          'font-bold uppercase',
          compact ? 'text-[10px]' : 'text-caption',
        )}
      >
        {label}
      </span>
    </div>
  );
}

type ConferenceStatusBadgeProps = {
  status: ConferenceItemStatus;
  compact?: boolean;
  className?: string;
};

const CONFERENCE_STYLES: Record<ConferenceItemStatus, string> = {
  concluido: 'text-tertiary',
  pendente: 'text-primary',
  divergente: 'text-destructive',
  iniciando: 'text-primary',
  'ajuste-peso': 'text-secondary',
};

const CONFERENCE_PILL_STYLES: Record<ConferenceItemStatus, string> = {
  concluido: 'bg-tertiary/10 text-tertiary',
  pendente: 'bg-primary/10 text-primary',
  divergente: 'bg-destructive/10 text-destructive',
  iniciando: 'bg-primary/10 text-primary',
  'ajuste-peso': 'bg-secondary/10 text-secondary',
};

export function ConferenceStatusBadge({
  status,
  compact = false,
  className,
}: ConferenceStatusBadgeProps) {
  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
          CONFERENCE_PILL_STYLES[status],
          className,
        )}
      >
        {CONFERENCE_STATUS_LABELS[status]}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'flex items-center gap-2 text-label-md font-medium',
        CONFERENCE_STYLES[status],
        className,
      )}
    >
      {CONFERENCE_STATUS_LABELS[status]}
    </span>
  );
}

type NfItemStatusBadgeProps = {
  status: NfItemStatus;
  className?: string;
};

const NF_ITEM_STYLES: Record<NfItemStatus, string> = {
  validado: 'text-tertiary font-bold',
  divergente: 'text-destructive font-bold',
  pendente: 'text-destructive font-bold',
};

export function NfItemStatusBadge({
  status,
  className,
}: NfItemStatusBadgeProps) {
  return (
    <span
      className={cn(
        'text-caption uppercase',
        NF_ITEM_STYLES[status],
        className,
      )}
    >
      {NF_ITEM_STATUS_LABELS[status]}
    </span>
  );
}

type TipoNfBadgeProps = {
  tipo: 'reentrega' | 'devolucao_parcial' | 'devolucao_total';
  compact?: boolean;
  className?: string;
};

export function TipoNfBadge({
  tipo,
  compact = false,
  className,
}: TipoNfBadgeProps) {
  const labels = {
    reentrega: 'Reentrega',
    devolucao_parcial: 'Dev. Parcial',
    devolucao_total: 'Dev. Total',
  };

  const styles = {
    reentrega: 'border-primary/20 bg-primary-container/10 text-primary',
    devolucao_parcial: 'border-secondary/20 bg-secondary/10 text-secondary',
    devolucao_total: 'border-tertiary/20 bg-tertiary/10 text-tertiary',
  };

  return (
    <span
      className={cn(
        'rounded border font-medium',
        compact
          ? 'px-1.5 py-0 text-[9px] uppercase'
          : 'px-2 py-0.5 text-caption',
        styles[tipo],
        className,
      )}
    >
      {labels[tipo]}
    </span>
  );
}
