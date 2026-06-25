'use client';

import { cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import type { TimelinePonto } from '@/features/torre-controle-expedicao/types/torre-controle.schema';

const TIPO_MARKER: Record<
  TimelinePonto['tipo'],
  { bar: string; dot: string }
> = {
  inicio: { bar: 'bg-muted', dot: 'bg-muted-foreground' },
  pico: { bar: 'bg-primary/70', dot: 'bg-primary' },
  critico: { bar: 'bg-destructive/70', dot: 'bg-destructive' },
  previsao_fim: { bar: 'bg-accent/60', dot: 'bg-accent' },
};

export type TimelineOperacionalProps = {
  pontos: TimelinePonto[];
  horaAtual?: string;
  className?: string;
};

export function TimelineOperacional({
  pontos,
  horaAtual = '02:35',
  className,
}: TimelineOperacionalProps) {
  const maxVolume = Math.max(...pontos.map((p) => p.volumeRelativo), 1);
  const nowIndex = pontos.findIndex((p) => p.label === 'Agora');

  return (
    <section
      id="timeline-operacional"
      className={cn(glassPanelClassName, 'rounded-xl p-4 md:p-6', className)}
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-label-md font-semibold text-foreground">
          Timeline Operacional
        </h2>
        <p className="text-caption text-muted-foreground">
          {pontos[0]?.hora} → {pontos[pontos.length - 1]?.hora}
        </p>
      </div>

      <div className="relative">
        {nowIndex >= 0 ? (
          <div
            className="pointer-events-none absolute bottom-6 top-0 z-10 w-px bg-destructive"
            style={{
              left: `${((nowIndex + 0.5) / pontos.length) * 100}%`,
            }}
            aria-hidden
          >
            <span className="absolute -top-5 -translate-x-1/2 whitespace-nowrap rounded bg-destructive/10 px-1.5 py-0.5 text-[9px] font-bold text-destructive">
              Agora {horaAtual}
            </span>
          </div>
        ) : null}

        <div className="flex items-end gap-1 overflow-x-auto pb-2">
          {pontos.map((ponto) => {
            const styles = TIPO_MARKER[ponto.tipo];
            const heightPct = (ponto.volumeRelativo / maxVolume) * 100;

            return (
              <div
                key={`${ponto.hora}-${ponto.label}`}
                className="flex min-w-[52px] flex-1 flex-col items-center gap-1"
                title={`${ponto.hora} — ${ponto.label} (${ponto.volumeRelativo}%)`}
              >
                <div className="relative flex h-24 w-full items-end justify-center">
                  <div
                    className={cn(
                      'w-full max-w-[36px] rounded-t-sm transition-all',
                      styles.bar,
                    )}
                    style={{ height: `${Math.max(8, heightPct)}%` }}
                  />
                  <div
                    className={cn(
                      'absolute -top-1 size-2 rounded-full',
                      styles.dot,
                      ponto.tipo === 'critico' && 'animate-pulse',
                    )}
                  />
                </div>
                <span className="text-[9px] font-mono tabular-nums text-muted-foreground">
                  {ponto.hora}
                </span>
                <span className="max-w-full truncate text-center text-[8px] text-muted-foreground">
                  {ponto.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-primary" /> Pico
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-destructive" /> Crítico
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-accent" /> Previsão
        </span>
      </div>
    </section>
  );
}
