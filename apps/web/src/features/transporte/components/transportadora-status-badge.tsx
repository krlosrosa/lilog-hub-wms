'use client';

import { cn } from '@lilog/ui';

import {
  TRANSPORTADORA_STATUS_LABELS,
  type TransportadoraStatus,
} from '@/features/transporte/types/transportadora.schema';

const STATUS_BADGE_CLASSES: Record<TransportadoraStatus, string> = {
  ativa: 'bg-primary/15 text-primary border-primary/30',
  inativa: 'bg-muted text-muted-foreground border-outline-variant',
};

const STATUS_DOT_CLASSES: Record<TransportadoraStatus, string> = {
  ativa: 'bg-primary',
  inativa: 'bg-muted-foreground',
};

type TransportadoraStatusBadgeProps = {
  status: TransportadoraStatus;
  compact?: boolean;
};

export function TransportadoraStatusBadge({
  status,
  compact = false,
}: TransportadoraStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center truncate rounded-full border px-1.5 font-semibold',
        compact ? 'py-0 text-[9px]' : 'py-0.5 text-[10px]',
        STATUS_BADGE_CLASSES[status],
      )}
    >
      <span
        className={cn(
          'mr-1 shrink-0 rounded-full',
          compact ? 'size-1' : 'size-1.5',
          STATUS_DOT_CLASSES[status],
        )}
        aria-hidden
      />
      {TRANSPORTADORA_STATUS_LABELS[status]}
    </span>
  );
}
