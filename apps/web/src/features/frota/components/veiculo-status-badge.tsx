'use client';

import { cn } from '@lilog/ui';

import {
  VEICULO_STATUS_LABELS,
  type VeiculoStatus,
} from '@/features/frota/types/frota.schema';

const STATUS_BADGE_CLASSES: Record<VeiculoStatus, string> = {
  ativo: 'bg-primary/15 text-primary border-primary/30',
  bloqueado: 'bg-destructive/15 text-destructive border-destructive/30',
  manutencao: 'bg-secondary/15 text-secondary-foreground border-secondary/30',
};

const STATUS_DOT_CLASSES: Record<VeiculoStatus, string> = {
  ativo: 'bg-primary',
  bloqueado: 'bg-destructive',
  manutencao: 'bg-secondary',
};

type VeiculoStatusBadgeProps = {
  status: VeiculoStatus;
  compact?: boolean;
};

export function VeiculoStatusBadge({
  status,
  compact = false,
}: VeiculoStatusBadgeProps) {
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
      {VEICULO_STATUS_LABELS[status]}
    </span>
  );
}
