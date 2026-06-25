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
        'flex min-w-0 items-center gap-4 rounded-xl border border-outline-variant bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass transition-colors hover:border-primary/30',
        variant === 'highlight' && 'border-primary/35 bg-primary/[0.04]',
        variant === 'critical' && 'border-l-4 border-l-destructive',
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
        'flex size-12 shrink-0 items-center justify-center rounded-lg',
        className,
      )}
    >
      {children}
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
    <div className={cn('grid gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-4', className)}>
      <StatCardShell>
        <IconBadge className="bg-primary/10 text-primary">
          <BarChart4 className="size-6" aria-hidden />
        </IconBadge>
        <div className="min-w-0 flex-1">
          <p className="text-caption text-muted-foreground">
            Acurácia global (último geral)
          </p>
          <div className="flex flex-wrap items-baseline gap-2">
            <p className="text-headline-md font-bold text-foreground">
              {kpi.acuraciaGlobal.toFixed(1)}
            </p>
            <span className="text-xs font-medium text-accent">
              ↑ {kpi.acuraciaDeltaPercent}%
            </span>
          </div>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(100, kpi.acuraciaGlobal)}%` }}
            />
          </div>
        </div>
      </StatCardShell>

      <StatCardShell>
        <IconBadge className="bg-accent/10 text-accent">
          <Package className="size-6" aria-hidden />
        </IconBadge>
        <div className="min-w-0 flex-1">
          <p className="text-caption text-muted-foreground">
            Itens inventariados (último geral)
          </p>
          <p className="text-headline-md font-bold text-foreground">
            {kItensDisplay}{' '}
            <span className="text-xs font-normal text-muted-foreground">
              / {nf.format(kpi.itensMeta)}
            </span>
          </p>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${pctItens}%` }}
            />
          </div>
        </div>
      </StatCardShell>

      <StatCardShell variant="critical">
        <IconBadge className="bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" aria-hidden />
        </IconBadge>
        <div className="min-w-0 flex-1">
          <p className="text-caption text-muted-foreground">
            Divergências totais (último geral)
          </p>
          <div className="flex flex-wrap items-baseline gap-2">
            <p className="text-headline-md font-bold text-destructive">
              {kpi.divergenciasTotal}
            </p>
            <span className="text-xs font-medium text-destructive">
              ↓ {kpi.divergenciasDelta}
            </span>
          </div>
          <div className="mt-3 flex gap-1">
            <div className="h-1 flex-1 rounded-full bg-destructive" />
            <div className="h-1 flex-1 rounded-full bg-muted" />
            <div className="h-1 flex-1 rounded-full bg-muted" />
          </div>
        </div>
      </StatCardShell>

      <StatCardShell variant="highlight">
        <IconBadge className="bg-primary/10 text-primary">
          <AlarmClock className="size-6" aria-hidden />
        </IconBadge>
        <div className="min-w-0 flex-1">
          <p className="text-caption text-muted-foreground">
            Status do inventário atual
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <span
                className="size-1.5 shrink-0 animate-pulse rounded-full bg-accent"
                aria-hidden
              />
              <span className="truncate">{kpi.statusAtualLabel}</span>
            </span>
          </div>
          <p className="mt-2 text-caption leading-snug text-muted-foreground">
            {kpi.tempoEstimadoLabel ?? '—'}
          </p>
        </div>
      </StatCardShell>
    </div>
  );
}
