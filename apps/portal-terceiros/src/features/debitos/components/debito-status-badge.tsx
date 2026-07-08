import { cn } from '@lilog/ui';

import type { ProcessoDebitoStatus } from '../types/debito.types';
import { DEBITO_STATUS_LABELS } from '../types/debito.types';

type DebitoStatusBadgeProps = {
  status: ProcessoDebitoStatus;
  className?: string;
};

const STATUS_STYLES: Record<ProcessoDebitoStatus, string> = {
  aberto: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  em_analise: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  aprovado: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  incluido_em_documento: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  cancelado: 'bg-muted text-muted-foreground',
};

export function DebitoStatusBadge({ status, className }: DebitoStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        STATUS_STYLES[status],
        className,
      )}
    >
      {DEBITO_STATUS_LABELS[status]}
    </span>
  );
}
