'use client';

import { cn } from '@lilog/ui';

import type { InventarioStatus } from '@/features/inventario/types/inventario-lista.schema';
import { INVENTARIO_STATUS_LABELS } from '@/features/inventario/types/inventario-lista.schema';

const toneByStatus: Record<
  InventarioStatus,
  { dot: string; text: string; pill?: string }
> = {
  concluido: {
    dot: 'bg-status-active',
    text: 'text-foreground',
    pill: 'bg-status-active/10',
  },
  'em-progresso': {
    dot: 'bg-primary animate-pulse',
    text: 'text-primary',
    pill: 'bg-primary/10',
  },
  agendado: {
    dot: 'bg-muted-foreground',
    text: 'text-muted-foreground',
    pill: 'bg-muted/50',
  },
};

export type InventarioStatusBadgeProps = {
  status: InventarioStatus;
  className?: string;
  compact?: boolean;
};

export function InventarioStatusBadge({
  status,
  className,
  compact = false,
}: InventarioStatusBadgeProps) {
  const tone = toneByStatus[status];
  const label = INVENTARIO_STATUS_LABELS[status];

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[9px] font-semibold',
          tone.pill,
          tone.text,
          className,
        )}
      >
        <span className={cn('size-1.5 shrink-0 rounded-full', tone.dot)} />
        {label}
      </span>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('size-2 shrink-0 rounded-full', tone.dot)} />
      <span className={cn('text-xs font-semibold', tone.text)}>{label}</span>
    </div>
  );
}
