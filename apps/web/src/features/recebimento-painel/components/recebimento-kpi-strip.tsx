'use client';

import { cn } from '@lilog/ui';

import type { KpiDashboard } from '@/features/dashboard-operacional/types/dashboard-operacional.schema';

const progressBarColor: Record<KpiDashboard['accent'], string> = {
  primary: 'hsl(var(--primary))',
  tertiary: 'hsl(158 64% 45%)',
  warning: 'hsl(38 92% 50%)',
  destructive: 'hsl(0 72% 55%)',
  muted: 'hsl(220 14% 45%)',
};

export function RecebimentoKpiStrip({
  kpis,
  variant = 'default',
}: {
  kpis: KpiDashboard[];
  variant?: 'default' | 'tv';
}) {
  const isTv = variant === 'tv';

  return (
    <div
      className={cn(
        'rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md',
        isTv
          ? 'grid grid-cols-3 gap-1.5 p-1.5 xl:grid-cols-6'
          : 'grid grid-cols-2 gap-2 p-2 sm:grid-cols-3 lg:grid-cols-6',
      )}
      aria-label="Indicadores resumidos do recebimento"
    >
      {kpis.map((kpi) => (
        <div
          key={kpi.id}
          className={cn(
            'rounded-lg bg-black/20 text-center',
            isTv ? 'px-1 py-1' : 'px-2 py-1.5',
          )}
        >
          <p
            className={cn(
              'truncate font-medium uppercase tracking-wider text-white/40',
              isTv ? 'text-[7px]' : 'text-[9px]',
            )}
          >
            {kpi.label}
          </p>
          <p
            className={cn(
              'font-bold tabular-nums leading-tight text-white',
              isTv ? 'mt-px text-sm xl:text-base' : 'mt-0.5 text-lg lg:text-xl',
            )}
          >
            {kpi.value}
            {kpi.suffix ? (
              <span
                className={cn(
                  'font-medium text-white/35',
                  isTv ? 'ml-0.5 text-[8px]' : 'ml-0.5 text-[10px]',
                )}
              >
                {kpi.suffix}
              </span>
            ) : null}
          </p>
          {typeof kpi.progress === 'number' ? (
            <div className="mx-auto mt-1 h-1 max-w-[48px] overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, kpi.progress)}%`,
                  backgroundColor: progressBarColor[kpi.accent],
                }}
              />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
