'use client';

import type { ReactNode } from 'react';

import {
  AlarmClock,
  AlertTriangle,
  BarChart4,
  Package,
} from 'lucide-react';

import { cn } from '@lilog/ui';

import type { InventarioKpi } from '@/features/inventario/types/inventario-lista.schema';

const nf = new Intl.NumberFormat('pt-BR');

export type InventarioKpiCardsProps = {
  kpi: InventarioKpi;
  className?: string;
};

function StatCardShell({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: 'default' | 'highlight' | 'critical';
}) {
  return (
    <div
      className={cn(
        'flex min-w-[9.5rem] shrink-0 snap-start items-center gap-2.5 rounded-lg border border-outline-variant bg-glass-bg px-3 py-2.5 shadow-inner-glow backdrop-blur-glass transition-colors hover:border-primary/25 sm:min-w-0',
        variant === 'highlight' && 'border-primary/30 bg-primary/[0.04]',
        variant === 'critical' && 'border-l-2 border-l-destructive pl-2.5',
      )}
    >
      {children}
    </div>
  );
}

function IconBadge({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-md',
        className,
      )}
    >
      {children}
    </div>
  );
}

function MiniProgress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn('h-full rounded-full', className)}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

export function InventarioKpiCards({ kpi, className }: InventarioKpiCardsProps) {
  const pctItens =
    kpi.itensMeta > 0
      ? Math.min(100, (kpi.itensInventariados / kpi.itensMeta) * 100)
      : 0;

  const kItensDisplay =
    kpi.itensInventariados >= 1000
      ? `${(kpi.itensInventariados / 1000).toFixed(1)}k`
      : nf.format(kpi.itensInventariados);

  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4 lg:gap-3',
        className,
      )}
    >
      <StatCardShell>
        <IconBadge className="bg-primary/10 text-primary">
          <BarChart4 className="size-4" aria-hidden />
        </IconBadge>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Acurácia global
          </p>
          <div className="flex items-baseline gap-1.5">
            <p className="text-lg font-bold tabular-nums text-foreground">
              {kpi.acuraciaGlobal.toFixed(1)}%
            </p>
            {kpi.acuraciaDeltaPercent !== 0 ? (
              <span className="text-[10px] font-medium text-accent">
                ↑ {kpi.acuraciaDeltaPercent}%
              </span>
            ) : null}
          </div>
          <MiniProgress value={kpi.acuraciaGlobal} className="bg-primary" />
        </div>
      </StatCardShell>

      <StatCardShell>
        <IconBadge className="bg-accent/10 text-accent">
          <Package className="size-4" aria-hidden />
        </IconBadge>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Itens contados
          </p>
          <p className="text-lg font-bold tabular-nums text-foreground">
            {kItensDisplay}
            <span className="ml-1 text-[10px] font-normal text-muted-foreground">
              / {nf.format(kpi.itensMeta)}
            </span>
          </p>
          <MiniProgress value={pctItens} className="bg-accent" />
        </div>
      </StatCardShell>

      <StatCardShell variant="critical">
        <IconBadge className="bg-destructive/10 text-destructive">
          <AlertTriangle className="size-4" aria-hidden />
        </IconBadge>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Divergências
          </p>
          <div className="flex items-baseline gap-1.5">
            <p className="text-lg font-bold tabular-nums text-destructive">
              {kpi.divergenciasTotal}
            </p>
            {kpi.divergenciasDelta !== 0 ? (
              <span className="text-[10px] font-medium text-destructive">
                ↓ {kpi.divergenciasDelta}
              </span>
            ) : null}
          </div>
          <MiniProgress
            value={Math.min(100, kpi.divergenciasTotal * 5)}
            className="bg-destructive"
          />
        </div>
      </StatCardShell>

      <StatCardShell variant="highlight">
        <IconBadge className="bg-primary/10 text-primary">
          <AlarmClock className="size-4" aria-hidden />
        </IconBadge>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Status atual
          </p>
          <span className="mt-0.5 inline-flex max-w-full items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-px text-[10px] font-semibold text-primary">
            <span
              className="size-1 shrink-0 animate-pulse rounded-full bg-accent"
              aria-hidden
            />
            <span className="truncate">{kpi.statusAtualLabel}</span>
          </span>
          {kpi.tempoEstimadoLabel ? (
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
              {kpi.tempoEstimadoLabel}
            </p>
          ) : null}
        </div>
      </StatCardShell>
    </div>
  );
}
