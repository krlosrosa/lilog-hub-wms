'use client';

import type { ReactNode } from 'react';

import {
  AlertTriangle,
  CalendarRange,
  Package2,
  Warehouse,
} from 'lucide-react';

import { cn } from '@lilog/ui';

import { useDisplayConfig } from '@/features/config-operacional/hooks/use-display-config';

type RecebimentoStatsCardsProps = {
  hoje: number;
  volumeEsperado: number;
  docasOcupadas: number;
  docasTotal: number;
  atrasos: number;
  onAtrasadosClick?: () => void;
};

function MetricCell({
  icon: Icon,
  label,
  value,
  hint,
  variant = 'default',
  progress,
  onClick,
}: {
  icon: typeof CalendarRange;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  variant?: 'default' | 'critical';
  progress?: number;
  onClick?: () => void;
}) {
  const conteudo = (
    <>
      <div className="flex items-center gap-1.5">
        <Icon
          className={cn(
            'size-3.5 shrink-0',
            variant === 'critical' ? 'text-destructive' : 'text-muted-foreground',
          )}
          aria-hidden
        />
        <p
          className={cn(
            'truncate text-[10px] font-semibold uppercase tracking-wide',
            variant === 'critical' ? 'text-destructive/90' : 'text-muted-foreground',
          )}
        >
          {label}
        </p>
      </div>
      <div className="flex min-w-0 items-baseline gap-1.5">
        <span
          className={cn(
            'text-lg font-bold tabular-nums leading-none sm:text-xl',
            variant === 'critical'
              ? 'text-destructive'
              : label === 'Hoje'
                ? 'text-primary'
                : 'text-foreground',
          )}
        >
          {value}
        </span>
        {hint ? (
          <span className="truncate text-[10px] text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      {progress !== undefined ? (
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-highest">
          <div
            className="h-full rounded-full bg-secondary transition-all duration-500"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Capacidade de docas"
          />
        </div>
      ) : null}
    </>
  );

  const classes = cn(
    'flex min-w-0 flex-1 flex-col gap-1 px-3 py-2.5 text-left sm:px-4 sm:py-3',
    variant === 'critical' && 'bg-destructive/[0.03]',
    onClick &&
      'cursor-pointer transition-colors hover:bg-surface-highest/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={classes}
        onClick={onClick}
        aria-label={`Filtrar atrasados: ${value}`}
      >
        {conteudo}
      </button>
    );
  }

  return <div className={classes}>{conteudo}</div>;
}

export function RecebimentoStatsCards({
  hoje,
  volumeEsperado,
  docasOcupadas,
  docasTotal,
  atrasos,
  onAtrasadosClick,
}: RecebimentoStatsCardsProps) {
  const { formatQtd } = useDisplayConfig();
  const formatNumber = new Intl.NumberFormat('pt-BR');
  const pctDocas =
    docasTotal > 0 ? Math.round((docasOcupadas / docasTotal) * 100) : 0;

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
      <div className="grid grid-cols-2 divide-x divide-y divide-outline-variant/50 sm:grid-cols-4 sm:divide-y-0">
        <MetricCell
          icon={CalendarRange}
          label="Hoje"
          value={formatNumber.format(hoje)}
          hint="agendados"
        />
        <MetricCell
          icon={Package2}
          label="Volume"
          value={formatQtd(volumeEsperado)}
          hint="unidades"
        />
        <MetricCell
          icon={Warehouse}
          label="Docas"
          value={`${docasOcupadas}/${docasTotal}`}
          hint={`${pctDocas}%`}
          progress={pctDocas}
        />
        <MetricCell
          icon={AlertTriangle}
          label="Atrasos"
          value={formatNumber.format(atrasos)}
          hint={atrasos === 1 ? 'crítico' : 'críticos'}
          variant="critical"
          onClick={atrasos > 0 ? onAtrasadosClick : undefined}
        />
      </div>
    </div>
  );
}
