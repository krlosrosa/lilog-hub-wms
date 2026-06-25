'use client';

import { cn } from '@lilog/ui';

import type { ConferenceItemStatus } from '@/features/devolucao/types/devolucao-detalhes.schema';
import { CONFERENCE_STATUS_LABELS } from '@/features/devolucao/types/devolucao-detalhes.schema';
import type { DemandaStatus } from '@/features/devolucao/types/devolucao-gestao.schema';
import { DEMANDA_STATUS_LABELS } from '@/features/devolucao/types/devolucao-gestao.schema';
import type { NfItemStatus } from '@/features/devolucao/types/devolucao-checkin.schema';
import { NF_ITEM_STATUS_LABELS } from '@/features/devolucao/types/devolucao-checkin.schema';

type DevolucaoStatusBadgeProps = {
  status: DemandaStatus;
  compact?: boolean;
  className?: string;
};

const STATUS_STYLES: Record<
  DemandaStatus,
  { dot: string; text: string; pulse?: boolean }
> = {
  'em-progresso': {
    dot: 'bg-tertiary',
    text: 'text-tertiary',
    pulse: true,
  },
  atrasado: {
    dot: 'bg-destructive',
    text: 'text-destructive',
  },
  finalizado: {
    dot: 'bg-muted-foreground',
    text: 'text-muted-foreground',
  },
  'aguardando-chegada': {
    dot: 'bg-primary',
    text: 'text-primary',
    pulse: true,
  },
};

const COMPACT_STATUS_LABELS: Record<DemandaStatus, string> = {
  'em-progresso': 'Progresso',
  atrasado: 'Atrasado',
  finalizado: 'Finalizado',
  'aguardando-chegada': 'Aguard.',
};

export function DevolucaoStatusBadge({
  status,
  compact = false,
  className,
}: DevolucaoStatusBadgeProps) {
  const styles = STATUS_STYLES[status];
  const label = compact
    ? COMPACT_STATUS_LABELS[status]
    : DEMANDA_STATUS_LABELS[status];

  return (
    <div
      className={cn(
        'flex items-center',
        compact ? 'gap-1' : 'gap-2',
        styles.text,
        className,
      )}
    >
      {status !== 'finalizado' && (
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
  className?: string;
};

const CONFERENCE_STYLES: Record<ConferenceItemStatus, string> = {
  concluido: 'text-tertiary',
  pendente: 'text-primary',
  divergente: 'text-destructive',
  iniciando: 'text-primary',
};

export function ConferenceStatusBadge({
  status,
  className,
}: ConferenceStatusBadgeProps) {
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

type TipoDemandaBadgeProps = {
  tipo: 'carga' | 'descarga';
  compact?: boolean;
  className?: string;
};

export function TipoDemandaBadge({
  tipo,
  compact = false,
  className,
}: TipoDemandaBadgeProps) {
  return (
    <span
      className={cn(
        'rounded border font-medium',
        compact
          ? 'px-1.5 py-0 text-[9px] uppercase'
          : 'px-2 py-0.5 text-caption',
        tipo === 'carga'
          ? 'border-primary/20 bg-primary-container/10 text-primary'
          : 'border-tertiary/20 bg-tertiary/10 text-tertiary',
        className,
      )}
    >
      {tipo === 'carga' ? 'Carga' : 'Descarga'}
    </span>
  );
}
