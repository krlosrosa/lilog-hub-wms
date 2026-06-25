'use client';

import { cn } from '@lilog/ui';

import type { InventarioStatus } from '@/features/inventario/types/inventario-lista.schema';
import { INVENTARIO_STATUS_LABELS } from '@/features/inventario/types/inventario-lista.schema';

const toneByStatus: Record<
  InventarioStatus,
  { dot: string; text: string }
> = {
  concluido: {
    dot: 'bg-status-active',
    text: 'text-foreground',
  },
  'em-progresso': {
    dot: 'bg-primary animate-pulse',
    text: 'text-primary',
  },
  agendado: {
    dot: 'bg-muted-foreground',
    text: 'text-muted-foreground',
  },
};

export type InventarioStatusBadgeProps = {
  status: InventarioStatus;
  className?: string;
};

export function InventarioStatusBadge({
  status,
  className,
}: InventarioStatusBadgeProps) {
  const tone = toneByStatus[status];
  const label = INVENTARIO_STATUS_LABELS[status];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('size-2 shrink-0 rounded-full', tone.dot)} />
      <span className={cn('text-xs font-semibold', tone.text)}>{label}</span>
    </div>
  );
}
