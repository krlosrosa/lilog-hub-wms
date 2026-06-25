'use client';

import { cn } from '@lilog/ui';

import type { StatusCustoFrete } from '@/features/transporte/types/transporte.schema';
import { STATUS_CUSTO_FRETE_LABELS } from '@/features/transporte/types/transporte.schema';

const STATUS_STYLES: Record<StatusCustoFrete, string> = {
  pendente: 'bg-muted text-muted-foreground ring-outline-variant',
  pago: 'bg-tertiary/15 text-tertiary ring-tertiary/20',
  contestado: 'bg-destructive/15 text-destructive ring-destructive/20',
};

const STATUS_DOT: Record<StatusCustoFrete, string> = {
  pendente: 'bg-muted-foreground',
  pago: 'bg-tertiary',
  contestado: 'bg-destructive',
};

type StatusCustoBadgeProps = {
  status: StatusCustoFrete;
  className?: string;
};

export function StatusCustoBadge({ status, className }: StatusCustoBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset',
        STATUS_STYLES[status],
        className,
      )}
    >
      <span
        className={cn('size-1.5 shrink-0 rounded-full', STATUS_DOT[status])}
        aria-hidden
      />
      {STATUS_CUSTO_FRETE_LABELS[status]}
    </span>
  );
}
