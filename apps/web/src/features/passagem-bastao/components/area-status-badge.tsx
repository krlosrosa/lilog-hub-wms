'use client';

import { cn } from '@lilog/ui';

import {
  AREA_STATUS_LABELS,
  type AreaLimpezaStatus,
} from '@/features/passagem-bastao/types/passagem-bastao.schema';

export type AreaStatusBadgeProps = {
  status: AreaLimpezaStatus;
  compact?: boolean;
};

const STATUS_STYLES: Record<AreaLimpezaStatus, string> = {
  limpo: 'border-tertiary/40 bg-tertiary/10 text-tertiary',
  sujo: 'border-destructive/40 bg-destructive/10 text-destructive',
  pendente: 'border-secondary/40 bg-secondary/10 text-secondary',
};

export function AreaStatusBadge({ status, compact = false }: AreaStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded border font-bold uppercase',
        compact ? 'px-1.5 py-0 text-[9px]' : 'px-2 py-0.5 text-[10px]',
        STATUS_STYLES[status],
      )}
    >
      {AREA_STATUS_LABELS[status]}
    </span>
  );
}
