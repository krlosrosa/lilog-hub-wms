'use client';

import { cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import type { TorreControleKpi } from '@/features/torre-controle-expedicao/types/torre-controle.schema';

const accentStyles = {
  primary: {
    border: 'border-l-primary',
    value: 'text-foreground',
    progress: 'bg-primary',
  },
  muted: {
    border: 'border-l-outline-variant',
    value: 'text-foreground',
    progress: 'bg-outline',
  },
  destructive: {
    border: 'border-l-destructive',
    value: 'text-destructive',
    progress: 'bg-destructive',
  },
  tertiary: {
    border: 'border-l-tertiary',
    value: 'text-tertiary',
    progress: 'bg-tertiary',
  },
  warning: {
    border: 'border-l-amber-500',
    value: 'text-amber-700 dark:text-amber-300',
    progress: 'bg-amber-500',
  },
} as const;

export type TorreControleKpiStripProps = {
  kpis: TorreControleKpi[];
  className?: string;
};

export function TorreControleKpiStrip({ kpis, className }: TorreControleKpiStripProps) {
  return (
    <section
      className={cn(
        '-mx-margin-mobile overflow-x-auto px-margin-mobile md:-mx-margin-desktop md:px-margin-desktop',
        className,
      )}
      aria-label="Indicadores principais"
    >
      <div className="flex min-w-max gap-3 pb-1 md:grid md:min-w-0 md:grid-cols-2 md:gap-gutter xl:grid-cols-4 2xl:grid-cols-8">
        {kpis.map((kpi) => {
          const styles = accentStyles[kpi.accent];
          const shouldPulse =
            kpi.accent === 'destructive' &&
            kpi.id === 'prioridades-pendentes' &&
            kpi.value !== '0';

          return (
            <article
              key={kpi.id}
              className={cn(
                glassPanelClassName,
                'relative w-[140px] shrink-0 overflow-hidden border-l-2 p-3 md:w-auto',
                styles.border,
                shouldPulse && 'animate-pulse',
              )}
            >
              <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {kpi.label}
              </p>
              <div className="mt-1 flex items-baseline gap-1">
                <span
                  className={cn(
                    'text-xl font-bold tabular-nums leading-none',
                    styles.value,
                  )}
                >
                  {kpi.value}
                </span>
                {kpi.suffix ? (
                  <span className="truncate text-[10px] text-muted-foreground">
                    {kpi.suffix}
                  </span>
                ) : null}
              </div>
              {kpi.id === 'volume-noite' ? (
                <p className="mt-0.5 text-[9px] font-medium uppercase text-muted-foreground">
                  kg finalizados
                </p>
              ) : null}
              {kpi.footer ? (
                <p className="mt-1 text-[9px] font-medium uppercase text-muted-foreground">
                  {kpi.footer}
                </p>
              ) : null}
              {typeof kpi.progress === 'number' ? (
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full transition-all', styles.progress)}
                    style={{ width: `${Math.min(100, kpi.progress)}%` }}
                  />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
