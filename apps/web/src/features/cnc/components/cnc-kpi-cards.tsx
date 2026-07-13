'use client';

import type { ReactNode } from 'react';

import { cn } from '@lilog/ui';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  XCircle,
} from 'lucide-react';

import type { CncKpi } from '@/features/cnc/types/cnc.schema';

type CncKpiCardsProps = {
  kpi: CncKpi;
  isLoading?: boolean;
};

function StatCard({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: 'default' | 'warning' | 'success';
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-outline-variant bg-glass-bg p-3.5 shadow-inner-glow backdrop-blur-glass transition-colors hover:border-primary/25 md:p-4',
        variant === 'warning' && 'hover:border-amber-500/30',
        variant === 'success' && 'hover:border-tertiary/30',
      )}
    >
      {children}
    </div>
  );
}

function StatIcon({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute right-2.5 top-2.5 opacity-[0.1]',
        className,
      )}
      aria-hidden
    >
      {children}
    </div>
  );
}

function StatProgress({
  value,
  total,
  className,
}: {
  value: number;
  total: number;
  className?: string;
}) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;

  return (
    <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-surface-highest">
      <div
        className={cn('h-full rounded-full transition-all duration-500', className)}
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

export function CncKpiCards({ kpi, isLoading = false }: CncKpiCardsProps) {
  const formatNumber = (value: number) =>
    isLoading ? '—' : value.toLocaleString('pt-BR');

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      <StatCard>
        <StatIcon>
          <ShieldAlert className="size-9 text-primary" />
        </StatIcon>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Total
        </p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-xl font-bold tabular-nums text-primary md:text-headline-md">
            {formatNumber(kpi.total)}
          </span>
          <span className="text-[10px] text-muted-foreground">CNCs</span>
        </div>
      </StatCard>

      <StatCard variant="warning">
        <StatIcon>
          <Clock className="size-9 text-amber-500" />
        </StatIcon>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Pendentes
        </p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-xl font-bold tabular-nums text-foreground md:text-headline-md">
            {formatNumber(kpi.pendentes)}
          </span>
          {!isLoading && kpi.total > 0 ? (
            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
              {Math.round((kpi.pendentes / kpi.total) * 100)}%
            </span>
          ) : null}
        </div>
        <StatProgress
          value={kpi.pendentes}
          total={kpi.total}
          className="bg-amber-500"
        />
      </StatCard>

      <StatCard>
        <StatIcon>
          <AlertTriangle className="size-9 text-secondary" />
        </StatIcon>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Em análise
        </p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-xl font-bold tabular-nums text-foreground md:text-headline-md">
            {formatNumber(kpi.emAnalise)}
          </span>
        </div>
        <StatProgress
          value={kpi.emAnalise}
          total={kpi.total}
          className="bg-secondary"
        />
      </StatCard>

      <StatCard variant="success">
        <StatIcon>
          <CheckCircle2 className="size-9 text-tertiary" />
        </StatIcon>
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Encerradas
          </p>
          {!isLoading && kpi.canceladas > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
              <XCircle className="size-2.5 shrink-0" aria-hidden />
              {kpi.canceladas}
            </span>
          ) : null}
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-xl font-bold tabular-nums text-foreground md:text-headline-md">
            {formatNumber(kpi.encerradas)}
          </span>
        </div>
        <StatProgress
          value={kpi.encerradas}
          total={kpi.total}
          className="bg-tertiary"
        />
      </StatCard>
    </div>
  );
}
