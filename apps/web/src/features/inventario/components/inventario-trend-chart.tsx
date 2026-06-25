'use client';

import { Rocket } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { toast } from 'sonner';

import { premiumCardClassName } from '@/features/inventario/components/form-field-classes';
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

  return (
    <div
      className={cn(
        'grid gap-4 md:gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]',
        className,
      )}
    >
      <section
        className={cn(
          premiumCardClassName,
          'flex flex-col justify-center overflow-hidden border-outline-variant bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass',
        )}
      >
        <div className="relative z-[1]">
          <h2 className="text-body-md font-semibold tracking-tight text-foreground md:text-label-md md:font-semibold">
            Análise de tendência mensal
          </h2>
          <p className="mt-1 text-caption text-muted-foreground">
            Acurácia média subiu 0,4% em relação ao trimestre anterior.
          </p>
          <div className="flex h-24 items-end gap-2 pt-4">
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
                      'relative w-full min-h-[18%] rounded-t-sm bg-primary/20 transition-colors hover:bg-primary',
                      isLast && 'bg-primary',
                    )}
                    style={{ height: `${String(hPct)}%` }}
                  >
                    <span className="pointer-events-none absolute -top-5 left-1/2 z-[2] hidden -translate-x-1/2 rounded bg-popover px-1 text-[10px] text-popover-foreground group-hover:inline-block">
                      {m.valorPercent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between px-0.5 text-caption text-muted-foreground">
            {meses.map((m) => (
              <span key={`lbl-${m.mes}`} className="flex-1 text-center">
                {m.mes}
              </span>
            ))}
          </div>
        </div>
      </section>

      <aside
        className={cn(
          premiumCardClassName,
          'flex flex-col border-outline-variant bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass',
        )}
      >
        <h2 className="mb-2 flex items-center gap-2 text-label-md font-semibold text-foreground">
          <Rocket className="size-4 shrink-0 text-secondary-foreground" aria-hidden />
          Dica do sistema
        </h2>
        <p className="text-caption leading-relaxed text-muted-foreground">
          Detectamos um padrão de divergência recorrente no setor{' '}
          <strong className="text-foreground">C (Refrigerados)</strong>. Recomendamos
          um inventário cíclico extra nesta semana.
        </p>
        <Button
          variant="outline"
          type="button"
          className="mt-4 w-full border-outline-variant text-foreground hover:bg-muted"
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
