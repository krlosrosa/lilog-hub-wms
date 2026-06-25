'use client';

import { Users } from 'lucide-react';

import { cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import type { RecursoSetor } from '@/features/torre-controle-expedicao/types/torre-controle.schema';

function saturacaoChipClass(percent: number, prodBelowMeta: boolean): string {
  if (percent >= 85 || prodBelowMeta) {
    return 'bg-destructive/10 text-destructive border-destructive/25';
  }

  if (percent >= 70) {
    return 'bg-tertiary-container text-tertiary border-tertiary/25';
  }

  return 'bg-accent/10 text-accent border-accent/25';
}

export type GestaoRecursosSetorPanelProps = {
  recursos: RecursoSetor[];
  className?: string;
};

export function GestaoRecursosSetorPanel({
  recursos,
  className,
}: GestaoRecursosSetorPanelProps) {
  return (
    <section
      id="gestao-recursos"
      className={cn(glassPanelClassName, 'rounded-xl p-4 md:p-6', className)}
    >
      <div className="mb-4 flex items-center gap-2">
        <Users className="size-5 text-primary" aria-hidden />
        <h2 className="text-label-md font-semibold text-foreground">
          Gestão de Recursos
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {recursos.map((recurso) => {
          const prodBelowMeta =
            recurso.produtividadeHora < recurso.metaProdutividadeHora * 0.8;
          const operadorPct = Math.round(
            (recurso.operadoresAtivos / recurso.operadoresTotal) * 100,
          );

          return (
            <article
              key={recurso.setor}
              className={cn(
                'rounded-lg border border-outline-variant bg-surface-low/50 p-3',
                (recurso.saturacaoPercent >= 85 || prodBelowMeta) &&
                  'border-destructive/30 bg-destructive/[0.03]',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {recurso.label}
                </h3>
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase',
                    saturacaoChipClass(recurso.saturacaoPercent, prodBelowMeta),
                  )}
                >
                  {recurso.saturacaoPercent}% sat.
                </span>
              </div>

              <p className="mt-2 text-caption text-muted-foreground">
                Operadores{' '}
                <span className="font-semibold tabular-nums text-foreground">
                  {recurso.operadoresAtivos}/{recurso.operadoresTotal}
                </span>
              </p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${operadorPct}%` }}
                />
              </div>

              <p className="mt-3 text-caption text-muted-foreground">
                Produtividade{' '}
                <span
                  className={cn(
                    'font-semibold tabular-nums',
                    prodBelowMeta ? 'text-destructive' : 'text-foreground',
                  )}
                >
                  {recurso.produtividadeHora}/h
                </span>{' '}
                <span className="text-muted-foreground">
                  (meta {recurso.metaProdutividadeHora}/h)
                </span>
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
