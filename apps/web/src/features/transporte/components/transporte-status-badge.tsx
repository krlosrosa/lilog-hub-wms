'use client';

import { cn } from '@lilog/ui';

import { accentSubtleBadgeClassName } from '@/lib/semantic-badge-classes';
import type { StatusTransporte } from '@/features/transporte/types/transporte.schema';
import { STATUS_TRANSPORTE_LABELS } from '@/features/transporte/types/transporte.schema';

const STATUS_STYLES: Record<StatusTransporte, string> = {
  PENDENTE: 'bg-destructive/15 text-destructive ring-destructive/20',
  ALOCADO: 'bg-tertiary/15 text-tertiary ring-tertiary/20',
  PARCIAL: 'bg-secondary/15 text-secondary ring-secondary/20',
  EM_SEPARACAO: 'bg-primary/15 text-primary ring-primary/20',
  SEPARADO: 'bg-primary/10 text-primary ring-primary/15',
  EM_CONFERENCIA: 'bg-warning/15 text-warning ring-warning/20',
  CONFERIDO: 'bg-warning/10 text-warning ring-warning/15',
  EM_CARREGAMENTO: accentSubtleBadgeClassName,
  CARREGADO: 'bg-success/15 text-success ring-success/20',
  EM_VIAGEM: 'bg-primary/15 text-primary ring-primary/20',
  VIAGEM_FINALIZADA: 'bg-muted text-muted-foreground ring-muted-foreground/20',
};

const STATUS_DOT: Record<StatusTransporte, string> = {
  PENDENTE: 'bg-destructive',
  ALOCADO: 'bg-tertiary',
  PARCIAL: 'bg-secondary',
  EM_SEPARACAO: 'bg-primary',
  SEPARADO: 'bg-primary/70',
  EM_CONFERENCIA: 'bg-warning',
  CONFERIDO: 'bg-warning/70',
  EM_CARREGAMENTO: 'bg-accent',
  CARREGADO: 'bg-success',
  EM_VIAGEM: 'bg-primary',
  VIAGEM_FINALIZADA: 'bg-muted-foreground',
};

type TransporteStatusBadgeProps = {
  status: StatusTransporte;
  className?: string;
};

export function TransporteStatusBadge({
  status,
  className,
}: TransporteStatusBadgeProps) {
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
      {STATUS_TRANSPORTE_LABELS[status]}
    </span>
  );
}
