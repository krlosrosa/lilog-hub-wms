import { Clock, TimerOff, TrendingUp } from 'lucide-react';

import { cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import type { KpiCard } from '@/features/gestao-recursos/types/gestao-recursos.schema';

const accentStyles = {
  primary: {
    border: 'border-l-primary',
    value: 'text-foreground',
    progress: 'bg-primary',
    text: 'text-primary',
  },
  tertiary: {
    border: 'border-l-tertiary',
    value: 'text-tertiary',
    progress: 'bg-tertiary',
    text: 'text-tertiary',
  },
  destructive: {
    border: 'border-l-destructive',
    value: 'text-destructive',
    progress: 'bg-destructive',
    text: 'text-destructive',
  },
  muted: {
    border: 'border-l-outline-variant',
    value: 'text-foreground',
    progress: 'bg-outline',
    text: 'text-muted-foreground',
  },
  warning: {
    border: 'border-l-amber-500',
    value: 'text-amber-700 dark:text-amber-300',
    progress: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
  },
} as const;

type KpiCardProps = {
  kpi: KpiCard;
};

export function KpiCardItem({ kpi }: KpiCardProps) {
  const styles = accentStyles[kpi.accent];

  return (
    <article
      className={cn(
        glassPanelClassName,
        'relative overflow-hidden border-l-2 p-3 transition-colors hover:bg-surface-high/30',
        styles.border,
        kpi.accent === 'destructive' && 'border-destructive/20',
        kpi.accent === 'warning' && 'border-amber-500/20',
      )}
    >
      <p
        className={cn(
          'truncate text-[10px] font-medium uppercase tracking-wide',
          kpi.accent === 'destructive'
            ? 'text-destructive'
            : kpi.accent === 'warning'
              ? 'text-amber-700 dark:text-amber-300'
              : 'text-muted-foreground',
        )}
      >
        {kpi.label}
      </p>

      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className={cn('text-xl font-bold tabular-nums leading-none', styles.value)}>
          {kpi.value}
        </span>
        {kpi.suffix ? (
          <span className={cn('truncate text-caption', styles.text)}>{kpi.suffix}</span>
        ) : null}
      </div>

      {typeof kpi.progress === 'number' ? (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-high">
            <div
              className={cn('h-full transition-all', styles.progress)}
              style={{ width: `${kpi.progress}%` }}
            />
          </div>
          <span className={cn('text-[10px] font-semibold tabular-nums', styles.text)}>
            {kpi.progress}%
          </span>
        </div>
      ) : null}

      {kpi.trend ? (
        <div className={cn('mt-1.5 flex items-center gap-1', styles.text)}>
          {kpi.trendIcon === 'up' ? (
            <TrendingUp className="h-3 w-3 shrink-0" aria-hidden />
          ) : null}
          <span className="truncate text-[10px] font-medium">{kpi.trend}</span>
        </div>
      ) : null}

      {kpi.footer ? (
        <div
          className={cn(
            'mt-1.5 flex items-center gap-1',
            kpi.accent === 'destructive'
              ? 'text-destructive/80'
              : kpi.accent === 'warning'
                ? 'text-amber-700/80 dark:text-amber-300/80'
                : 'text-muted-foreground',
          )}
        >
          {kpi.accent === 'destructive' ? (
            <TimerOff className="h-3 w-3 shrink-0" aria-hidden />
          ) : (
            <Clock className="h-3 w-3 shrink-0" aria-hidden />
          )}
          <span className="truncate text-[10px] font-medium">{kpi.footer}</span>
        </div>
      ) : null}
    </article>
  );
}
