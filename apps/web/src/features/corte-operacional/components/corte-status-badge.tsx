import { cn } from '@lilog/ui';

import type { CorteStatus } from '@/features/corte-operacional/types/corte-operacional.schema';
import { CORTE_STATUS_LABELS } from '@/features/corte-operacional/types/corte-operacional.schema';

const STATUS_STYLES: Record<CorteStatus, string> = {
  solicitado: 'border-primary/30 bg-primary/10 text-primary',
  em_andamento: 'border-tertiary/30 bg-tertiary/10 text-tertiary',
  concluido: 'border-status-active/30 bg-status-active/10 text-status-active',
  cancelado: 'border-muted bg-muted/30 text-muted-foreground',
};

type CorteStatusBadgeProps = {
  status: CorteStatus;
  compact?: boolean;
};

export function CorteStatusBadge({ status, compact }: CorteStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold',
        STATUS_STYLES[status],
      )}
    >
      {compact
        ? CORTE_STATUS_LABELS[status].slice(0, 6)
        : CORTE_STATUS_LABELS[status]}
    </span>
  );
}
