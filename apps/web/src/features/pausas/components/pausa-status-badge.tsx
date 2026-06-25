'use client';

import { cn } from '@lilog/ui';

import {
  PAUSA_MONITOR_STATUS_LABELS,
  PAUSA_REGISTRO_STATUS_LABELS,
  type PausaMonitorStatus,
  type PausaRegistroStatus,
} from '@/features/pausas/types/pausas.schema';

type MonitorVariant = {
  kind: 'monitor';
  status: PausaMonitorStatus;
  tempo?: string;
  compact?: boolean;
};

type RegistroVariant = {
  kind: 'registro';
  status: PausaRegistroStatus;
  compact?: boolean;
};

export type PausaStatusBadgeProps = MonitorVariant | RegistroVariant;

export function PausaStatusBadge(props: PausaStatusBadgeProps) {
  if (props.kind === 'registro') {
    const isExcedente = props.status === 'excedente';
    const compact = props.compact ?? false;
    return (
      <span
        className={cn(
          'inline-flex rounded border font-medium',
          compact
            ? 'px-1.5 py-0 text-[9px]'
            : 'rounded-md px-2 py-0.5 text-caption',
          isExcedente
            ? 'border-destructive/40 bg-destructive/10 text-destructive'
            : 'border-tertiary/30 bg-tertiary-container/15 text-tertiary',
        )}
      >
        {PAUSA_REGISTRO_STATUS_LABELS[props.status]}
      </span>
    );
  }

  const isAtrasado = props.status === 'atrasado';
  const compact = props.compact ?? false;
  return (
    <div className={cn('flex flex-col items-end', compact ? 'gap-0' : 'gap-0.5')}>
      <span
        className={cn(
          'inline-flex rounded font-bold uppercase tracking-wide',
          compact
            ? 'px-1 py-px text-[8px] leading-tight'
            : 'px-1.5 py-0.5 text-caption',
          isAtrasado
            ? 'animate-pulse bg-destructive/15 text-destructive ring-1 ring-destructive/40'
            : 'bg-status-active/15 text-status-active',
        )}
      >
        {PAUSA_MONITOR_STATUS_LABELS[props.status]}
      </span>
      {props.tempo && (
        <span
          className={cn(
            'font-mono tabular-nums',
            compact ? 'text-[9px]' : 'text-caption',
            isAtrasado ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {props.tempo}
        </span>
      )}
    </div>
  );
}
