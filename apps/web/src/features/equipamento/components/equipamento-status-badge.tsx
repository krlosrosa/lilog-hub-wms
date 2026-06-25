'use client';

import { cn } from '@lilog/ui';

import {
  EQUIPAMENTO_STATUS_LABELS,
  type EquipamentoStatus,
} from '@/features/equipamento/types/equipamento.schema';

const STATUS_BADGE_CLASSES: Record<EquipamentoStatus, string> = {
  operando: 'bg-primary/15 text-primary border-primary/30',
  pausa: 'bg-secondary/15 text-secondary-foreground border-secondary/30',
  manutencao: 'bg-tertiary-container/30 text-on-tertiary-container border-tertiary/30',
  bloqueado: 'bg-destructive/15 text-destructive border-destructive/30',
};

const STATUS_DOT_CLASSES: Record<EquipamentoStatus, string> = {
  operando: 'bg-primary',
  pausa: 'bg-secondary',
  manutencao: 'bg-tertiary',
  bloqueado: 'bg-destructive animate-pulse',
};

type EquipamentoStatusBadgeProps = {
  status: EquipamentoStatus;
  compact?: boolean;
};

export function EquipamentoStatusBadge({
  status,
  compact = false,
}: EquipamentoStatusBadgeProps) {
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
      {EQUIPAMENTO_STATUS_LABELS[status]}
    </span>
  );
}
