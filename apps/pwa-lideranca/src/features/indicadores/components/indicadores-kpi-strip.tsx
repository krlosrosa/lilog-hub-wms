import {
  AlertOctagon,
  ClockAlert,
  Gauge,
  Star,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@lilog/ui';

type IndicadoresKpiStripProps = {
  prioritariosAtrasados: number;
  emRisco: string;
  sla: string;
  prioridadesPendentes: string;
  className?: string;
};

type KpiItem = {
  id: string;
  label: string;
  value: string;
  suffix?: string;
  icon: LucideIcon;
  accent: 'destructive' | 'warning' | 'primary' | 'tertiary';
  progress?: number;
};

const ACCENT_STYLES = {
  destructive: {
    card: 'bg-error-container/40 border-destructive/20',
    icon: 'bg-destructive/15 text-destructive',
    value: 'text-destructive',
    bar: 'bg-destructive',
  },
  warning: {
    card: 'bg-warning-container/30 border-warning/25',
    icon: 'bg-warning/15 text-warning',
    value: 'text-on-warning-container',
    bar: 'bg-warning',
  },
  primary: {
    card: 'bg-surface border-outline-variant/80',
    icon: 'bg-secondary/10 text-secondary',
    value: 'text-on-surface',
    bar: 'bg-secondary',
  },
  tertiary: {
    card: 'bg-surface-container border-outline-variant/60',
    icon: 'bg-primary/10 text-primary',
    value: 'text-on-surface',
    bar: 'bg-primary',
  },
} as const;

export function IndicadoresKpiStrip({
  prioritariosAtrasados,
  emRisco,
  sla,
  prioridadesPendentes,
  className,
}: IndicadoresKpiStripProps) {
  const slaNum = Number.parseInt(sla, 10) || 0;

  const kpis: KpiItem[] = [
    {
      id: 'prioritarios-atrasados',
      label: 'Prior. atrasados',
      value: String(prioritariosAtrasados),
      icon: ClockAlert,
      accent: 'destructive',
    },
    {
      id: 'em-risco',
      label: 'Em risco',
      value: emRisco,
      icon: AlertOctagon,
      accent: 'warning',
    },
    {
      id: 'sla',
      label: 'SLA operação',
      value: sla,
      suffix: '%',
      icon: Gauge,
      accent: 'primary',
      progress: slaNum,
    },
    {
      id: 'prioridades-pendentes',
      label: 'Prior. pendentes',
      value: prioridadesPendentes,
      icon: Star,
      accent: 'tertiary',
    },
  ];

  return (
    <section className={cn('ml-2 space-y-1.5', className)} aria-label="Indicadores críticos">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-on-surface-variant">
        Visão rápida
      </p>
      <div className="overflow-x-auto hide-scrollbar snap-x snap-mandatory">
        <div className="flex min-w-max gap-2 pb-0.5">
          {kpis.map((kpi) => {
            const styles = ACCENT_STYLES[kpi.accent];
            const Icon = kpi.icon;
            const shouldPulse =
              kpi.accent === 'destructive' && kpi.value !== '0';

            return (
              <article
                key={kpi.id}
                className={cn(
                  'w-[112px] shrink-0 snap-start rounded-xl border p-2.5 shadow-sm transition-transform active:scale-[0.98]',
                  styles.card,
                  shouldPulse && 'animate-pulse',
                )}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg',
                    styles.icon,
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </div>
                <p className="mt-1.5 truncate text-[9px] font-medium uppercase tracking-wide text-on-surface-variant">
                  {kpi.label}
                </p>
                <div className="mt-0.5 flex items-baseline gap-0.5">
                  <span
                    className={cn(
                      'font-mono text-xl font-bold tabular-nums leading-none',
                      styles.value,
                    )}
                  >
                    {kpi.value}
                  </span>
                  {kpi.suffix ? (
                    <span className="text-xs font-medium text-on-surface-variant">
                      {kpi.suffix}
                    </span>
                  ) : null}
                </div>
                {typeof kpi.progress === 'number' ? (
                  <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-surface-container">
                    <div
                      className={cn('h-full rounded-full transition-all', styles.bar)}
                      style={{ width: `${Math.min(100, kpi.progress)}%` }}
                    />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
