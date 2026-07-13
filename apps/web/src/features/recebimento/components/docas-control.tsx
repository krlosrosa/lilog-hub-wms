'use client';

import { Warehouse } from 'lucide-react';

import { cn } from '@lilog/ui';

import { DocaCard } from '@/features/recebimento/components/doca-card';
import type { DocaItem } from '@/features/recebimento/types/recebimento-lista.schema';

type DocasControlProps = {
  docas: readonly DocaItem[];
  compact?: boolean;
};

const LEGEND = [
  { label: 'Livre', className: 'bg-status-active' },
  { label: 'Ocupada', className: 'bg-primary' },
  { label: 'Manut.', className: 'bg-outline' },
] as const;

export function DocasControl({ docas, compact }: DocasControlProps) {
  const ocupadas = docas.filter((d) => d.status === 'ocupada').length;
  const manutencao = docas.filter((d) => d.status === 'manutencao').length;
  const pctOcupacao =
    docas.length > 0 ? Math.round((ocupadas / docas.length) * 100) : 0;

  return (
    <section
      aria-labelledby="titulo-controle-docas"
      className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass"
    >
      <div
        className={cn(
          'border-b border-outline-variant bg-surface-low/30',
          compact ? 'space-y-2 px-3 py-2.5' : 'px-4 py-3',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary-container text-on-secondary-container">
              <Warehouse className="size-3.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2
                id="titulo-controle-docas"
                className="text-xs font-semibold text-foreground"
              >
                Controle de docas
              </h2>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {ocupadas}/{docas.length} ocupadas
                {manutencao > 0 ? ` · ${manutencao} manut.` : ''}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="font-mono text-sm font-bold tabular-nums text-foreground">
              {pctOcupacao}%
            </span>
            <div className="h-1 w-16 overflow-hidden rounded-full bg-surface-highest">
              <div
                className="h-full rounded-full bg-secondary transition-all"
                style={{ width: `${pctOcupacao}%` }}
                role="progressbar"
                aria-valuenow={pctOcupacao}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Taxa de ocupação das docas"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-[9px] text-muted-foreground">
          {LEGEND.map(({ label, className }) => (
            <span key={label} className="inline-flex items-center gap-1">
              <span
                className={cn('size-1.5 rounded-full', className)}
                aria-hidden
              />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div
        className={cn(
          'grid gap-1.5 p-2.5',
          compact
            ? 'grid-cols-4 sm:grid-cols-5 xl:grid-cols-3'
            : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6',
        )}
      >
        {docas.map((d) => (
          <DocaCard key={d.numero} doca={d} />
        ))}
      </div>
    </section>
  );
}
