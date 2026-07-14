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

const fractionAccentColor: Record<KpiDashboard['accent'], string> = {
  primary: 'text-primary',
  tertiary: 'text-emerald-400',
  warning: 'text-amber-400',
  destructive: 'text-red-400',
  muted: 'text-white/70',
};

function parseFractionValue(
  value: string,
): { current: string; total: string } | null {
  const slashIndex = value.indexOf('/');
  if (slashIndex === -1) {
    return null;
  }

  const current = value.slice(0, slashIndex).trim();
  const total = value.slice(slashIndex + 1).trim();

  if (!current || !total) {
    return null;
  }

  return { current, total };
}

function KpiValue({
  kpi,
  isTv,
}: {
  kpi: KpiDashboard;
  isTv: boolean;
}) {
  const fraction = parseFractionValue(kpi.value);
  const accentColor = fractionAccentColor[kpi.accent];

  if (fraction) {
    return (
      <div
        className={cn(
          'flex flex-col items-center leading-tight',
          isTv ? 'mt-px gap-px' : 'mt-0.5 gap-0.5',
        )}
      >
        <span
          className={cn(
            'font-bold tabular-nums text-white',
            isTv ? 'text-xs xl:text-sm' : 'text-sm lg:text-base',
          )}
        >
          {fraction.current}
          {kpi.suffix ? (
            <span
              className={cn(
                'ml-0.5 font-semibold',
                accentColor,
                isTv ? 'text-[7px]' : 'text-[9px]',
              )}
            >
              {kpi.suffix}
            </span>
          ) : null}
        </span>
        <span
          className={cn(
            'tabular-nums text-white/35',
            isTv ? 'text-[7px]' : 'text-[10px]',
          )}
        >
          <span className="text-white/20">/</span> {fraction.total}
        </span>
      </div>
    );
  }

  return (
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
  );
}

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
          <KpiValue kpi={kpi} isTv={isTv} />
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
