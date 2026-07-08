'use client';

import { Lightbulb, Rocket } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { toast } from 'sonner';

import type { TrendMes } from '@/features/inventario/types/inventario-lista.schema';

export type InventarioTrendChartProps = {
  meses: TrendMes[];
  className?: string;
};

export function InventarioTrendChart({
  meses,
  className,
}: InventarioTrendChartProps) {
  const valores = meses.map((m) => m.valorPercent);
  const vmax = Math.max(...valores, 1);
  const ultimoValor = meses.at(-1)?.valorPercent;

  return (
    <div
      className={cn(
        'grid gap-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-3',
        className,
      )}
    >
      <section className="overflow-hidden rounded-lg border border-outline-variant bg-glass-bg p-3 shadow-inner-glow backdrop-blur-glass">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[11px] font-semibold text-foreground">
              Tendência mensal
            </h2>
            <p className="text-[10px] text-muted-foreground">
              Acurácia média +0,4% vs. trimestre anterior
            </p>
          </div>
          {ultimoValor != null ? (
            <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
              {ultimoValor}%
            </span>
          ) : null}
        </div>

        {meses.length === 0 ? (
          <div className="mt-2 flex h-14 items-center justify-center rounded-md border border-dashed border-outline-variant/50 text-[10px] text-muted-foreground">
            Sem histórico para exibir tendência
          </div>
        ) : (
          <>
            <div className="mt-2 flex h-14 items-end gap-1">
              {meses.map((m, i) => {
                const hPct = (m.valorPercent / vmax) * 100;
                const isLast = i === meses.length - 1;

                return (
                  <div
                    key={`${m.mes}-${String(i)}`}
                    className="group relative flex flex-1 flex-col justify-end"
                    title={`${String(m.valorPercent)}%`}
                  >
                    <div
                      className={cn(
                        'relative w-full min-h-[12%] rounded-t-sm bg-primary/15 transition-colors group-hover:bg-primary/40',
                        isLast && 'bg-primary',
                      )}
                      style={{ height: `${String(hPct)}%` }}
                    >
                      <span className="pointer-events-none absolute -top-4 left-1/2 z-[2] hidden -translate-x-1/2 rounded bg-popover px-1 text-[9px] text-popover-foreground group-hover:inline-block">
                        {m.valorPercent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
              {meses.map((m) => (
                <span key={`lbl-${m.mes}`} className="flex-1 text-center">
                  {m.mes}
                </span>
              ))}
            </div>
          </>
        )}
      </section>

      <aside className="flex flex-col justify-between rounded-lg border border-outline-variant bg-glass-bg p-3 shadow-inner-glow backdrop-blur-glass">
        <div>
          <h2 className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
            <Rocket
              className="size-3 shrink-0 text-secondary-foreground"
              aria-hidden
            />
            Dica do sistema
          </h2>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            <Lightbulb
              className="-mt-px mr-0.5 inline size-3 text-accent"
              aria-hidden
            />
            Divergência recorrente no setor{' '}
            <strong className="text-foreground">C (Refrigerados)</strong>.
            Considere um ciclo extra esta semana.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          type="button"
          className="mt-2 h-7 w-full border-outline-variant text-[11px] text-foreground hover:bg-muted"
          onClick={() => {
            toast.info('Agendamento (mock)');
          }}
        >
          Agendar ciclo extra
        </Button>
      </aside>
    </div>
  );
}
