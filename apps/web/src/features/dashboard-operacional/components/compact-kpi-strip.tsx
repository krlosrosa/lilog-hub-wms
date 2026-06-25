'use client';

import type { KpiDashboard } from '@/features/dashboard-operacional/types/dashboard-operacional.schema';

const progressBarColor: Record<KpiDashboard['accent'], string> = {
  primary: 'hsl(var(--primary))',
  tertiary: 'hsl(158 64% 45%)',
  warning: 'hsl(38 92% 50%)',
  destructive: 'hsl(0 72% 55%)',
  muted: 'hsl(220 14% 45%)',
};

export function CompactKpiStrip({ kpis }: { kpis: KpiDashboard[] }) {
  const ordered = [
    'volume-dia',
    'largadas',
    'entregas-realizadas',
    'pct-entrega',
    'devolucoes',
    'pct-devolucao',
    'ocorrencias-abertas',
    'peso-despachado',
  ]
    .map((id) => kpis.find((k) => k.id === id))
    .filter(Boolean) as KpiDashboard[];

  return (
    <div
      className="grid grid-cols-4 gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-2 backdrop-blur-md lg:grid-cols-8"
      aria-label="Indicadores resumidos"
    >
      {ordered.map((kpi) => (
        <div
          key={kpi.id}
          className="rounded-lg bg-black/20 px-2 py-1.5 text-center"
        >
          <p className="truncate text-[9px] font-medium uppercase tracking-wider text-white/40">
            {kpi.label}
          </p>
          <p className="mt-0.5 text-lg font-bold tabular-nums leading-tight text-white lg:text-xl">
            {kpi.value}
            {kpi.suffix ? (
              <span className="ml-0.5 text-[10px] font-medium text-white/35">
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
