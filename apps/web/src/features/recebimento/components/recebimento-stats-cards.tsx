'use client';

import type { ReactNode } from 'react';

import {
  AlertTriangle,
  CalendarRange,
  Package2,
  Warehouse,
} from 'lucide-react';

import { cn } from '@lilog/ui';

type RecebimentoStatsCardsProps = {
  hoje: number;
  volumeEsperado: number;
  docasOcupadas: number;
  docasTotal: number;
  atrasos: number;
};

function StatCardShell({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: 'default' | 'critical';
}) {
  return (
    <div
      className={cn(
        'flex flex-col justify-between rounded-lg border border-outline-variant bg-glass-bg p-3 shadow-inner-glow backdrop-blur-glass transition-colors hover:border-primary/25',
        variant === 'critical' && 'border-destructive/30 hover:border-destructive/45',
      )}
    >
      {children}
    </div>
  );
}

export function RecebimentoStatsCards({
  hoje,
  volumeEsperado,
  docasOcupadas,
  docasTotal,
  atrasos,
}: RecebimentoStatsCardsProps) {
  const formatNumber = new Intl.NumberFormat('pt-BR');
  const pctDocas =
    docasTotal > 0 ? Math.round((docasOcupadas / docasTotal) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <StatCardShell>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium text-muted-foreground">
            Recebimentos hoje
          </span>
          <CalendarRange className="size-3.5 text-primary" aria-hidden />
        </div>
        <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
          {formatNumber.format(hoje)}
          <span className="ml-1 text-[10px] font-normal text-muted-foreground">
            total
          </span>
        </p>
      </StatCardShell>

      <StatCardShell>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium text-muted-foreground">
            Volume esperado
          </span>
          <Package2 className="size-3.5 text-tertiary" aria-hidden />
        </div>
        <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
          {formatNumber.format(volumeEsperado)}
          <span className="ml-1 text-[10px] font-normal text-muted-foreground">
            UN
          </span>
        </p>
      </StatCardShell>

      <StatCardShell>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium text-muted-foreground">
            Docas ocupadas
          </span>
          <Warehouse className="size-3.5 text-secondary-foreground" aria-hidden />
        </div>
        <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
          {docasOcupadas}/{docasTotal}
          <span className="ml-1 text-[10px] font-normal text-muted-foreground">
            {pctDocas}%
          </span>
        </p>
        <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-surface-highest">
          <div
            className="h-full rounded-full bg-secondary transition-all"
            style={{ width: `${pctDocas}%` }}
          />
        </div>
      </StatCardShell>

      <StatCardShell variant="critical">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium text-destructive/90">
            Atrasos
          </span>
          <AlertTriangle className="size-3.5 text-destructive" aria-hidden />
        </div>
        <p className="mt-1 text-xl font-semibold tabular-nums text-destructive">
          {formatNumber.format(atrasos)}
          <span className="ml-1 text-[10px] font-normal text-destructive/80">
            crítico
          </span>
        </p>
      </StatCardShell>
    </div>
  );
}
