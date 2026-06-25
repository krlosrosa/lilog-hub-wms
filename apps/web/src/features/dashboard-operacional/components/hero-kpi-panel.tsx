'use client';

import {
  AlertTriangle,
  Package,
  RotateCcw,
  Truck,
  Weight,
} from 'lucide-react';

import { cn } from '@lilog/ui';

import { EntregaRingChart } from '@/features/dashboard-operacional/components/entrega-ring-chart';
import type { KpiDashboard } from '@/features/dashboard-operacional/types/dashboard-operacional.schema';

const heroCardClassName =
  'relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md md:p-6';

export type HeroKpiPanelProps = {
  kpis: KpiDashboard[];
  className?: string;
};

function findKpi(kpis: KpiDashboard[], id: string) {
  return kpis.find((k) => k.id === id);
}

export function HeroKpiPanel({ kpis, className }: HeroKpiPanelProps) {
  const volume = findKpi(kpis, 'volume-dia');
  const largadas = findKpi(kpis, 'largadas');
  const entregas = findKpi(kpis, 'entregas-realizadas');
  const pctEntrega = findKpi(kpis, 'pct-entrega');
  const devolucoes = findKpi(kpis, 'devolucoes');
  const pctDevolucao = findKpi(kpis, 'pct-devolucao');
  const ocorrencias = findKpi(kpis, 'ocorrencias-abertas');
  const peso = findKpi(kpis, 'peso-despachado');

  const pctEntregaNum = pctEntrega?.progress ?? 0;
  const pctDevolucaoNum = pctDevolucao?.progress ?? 0;

  return (
    <section
      className={cn('grid grid-cols-12 gap-4 lg:gap-5', className)}
      aria-label="Indicadores principais"
    >
      {/* Volume + Largadas */}
      <div className="col-span-12 grid gap-4 sm:grid-cols-2 lg:col-span-4">
        <article className={cn(heroCardClassName, 'group')}>
          <div
            className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/20 blur-3xl transition-opacity group-hover:opacity-100"
            aria-hidden
          />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                {volume?.label ?? 'Volume do Dia'}
              </p>
              <p className="mt-2 text-4xl font-bold tabular-nums text-white md:text-5xl">
                {volume?.value ?? '—'}
              </p>
              <p className="mt-1 text-lg text-primary">{volume?.suffix ?? 'NFs'}</p>
            </div>
            <Package className="size-10 text-primary/60" aria-hidden />
          </div>
        </article>

        <article className={cn(heroCardClassName, 'group')}>
          <div
            className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-secondary/20 blur-3xl"
            aria-hidden
          />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                {largadas?.label ?? 'Largadas'}
              </p>
              <p className="mt-2 text-4xl font-bold tabular-nums text-white md:text-5xl">
                {largadas?.value ?? '—'}
              </p>
              <p className="mt-1 text-lg text-secondary">{largadas?.suffix ?? 'rotas'}</p>
            </div>
            <Truck className="size-10 text-secondary/60" aria-hidden />
          </div>
        </article>
      </div>

      {/* Ring — % entrega */}
      <article
        className={cn(
          heroCardClassName,
          'col-span-12 flex flex-col items-center justify-center py-6 lg:col-span-4',
        )}
      >
        <EntregaRingChart
          percentual={pctEntregaNum}
          sublabel={`${entregas?.value ?? '—'} ${entregas?.suffix ?? 'NFs'} entregues`}
        />
      </article>

      {/* Devoluções + Ocorrências + Peso */}
      <div className="col-span-12 grid gap-4 sm:grid-cols-3 lg:col-span-4">
        <article className={cn(heroCardClassName, 'border-amber-500/20')}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/80">
                {devolucoes?.label ?? 'Devoluções'}
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-amber-300 md:text-4xl">
                {devolucoes?.value ?? '—'}
              </p>
              <p className="text-sm text-amber-400/70">
                {pctDevolucaoNum.toLocaleString('pt-BR', {
                  maximumFractionDigits: 1,
                })}
                % do volume
              </p>
            </div>
            <RotateCcw className="size-8 shrink-0 text-amber-500/50" aria-hidden />
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-amber-500 shadow-[0_0_12px_hsl(38_92%_50%/0.5)] transition-all duration-1000"
              style={{ width: `${Math.min(100, pctDevolucaoNum * 4)}%` }}
            />
          </div>
        </article>

        <article
          className={cn(
            heroCardClassName,
            'border-destructive/30',
            ocorrencias?.value !== '0' && 'animate-pulse',
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-destructive/80">
                {ocorrencias?.label ?? 'Ocorrências'}
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-destructive md:text-4xl">
                {ocorrencias?.value ?? '—'}
              </p>
              <p className="text-sm text-white/40">abertas</p>
            </div>
            <AlertTriangle className="size-8 shrink-0 text-destructive/60" aria-hidden />
          </div>
        </article>

        <article className={heroCardClassName}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                {peso?.label ?? 'Peso Despachado'}
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-white md:text-3xl">
                {peso?.value ?? '—'}
              </p>
              <p className="text-sm text-white/40">{peso?.suffix ?? 'kg'}</p>
            </div>
            <Weight className="size-8 shrink-0 text-white/30" aria-hidden />
          </div>
        </article>
      </div>
    </section>
  );
}
