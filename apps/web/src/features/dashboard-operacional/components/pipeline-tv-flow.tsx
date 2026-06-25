'use client';

import { cn } from '@lilog/ui';

import type { EtapaPipeline } from '@/features/dashboard-operacional/types/dashboard-operacional.schema';

const panelClassName =
  'rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md md:p-6';

export type PipelineTvFlowProps = {
  etapas: EtapaPipeline[];
  className?: string;
};

export function PipelineTvFlow({ etapas, className }: PipelineTvFlowProps) {
  return (
    <section
      className={cn(panelClassName, className)}
      aria-label="Fluxo operacional do dia"
    >
      <header className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold uppercase tracking-widest text-white/90 md:text-xl">
            Fluxo do Dia
          </h2>
          <p className="mt-1 text-sm text-white/40">
            Volume nas etapas operacionais
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
        {etapas.map((etapa, index) => (
          <div key={etapa.id} className="relative">
            {index > 0 ? (
              <div
                className="absolute -left-2 top-1/2 hidden h-0.5 w-4 -translate-y-1/2 bg-white/20 lg:block"
                aria-hidden
              />
            ) : null}
            <div
              className={cn(
                'rounded-xl border border-white/10 bg-black/20 p-4 transition-colors',
                etapa.id === 'entregue' && 'border-emerald-500/30 bg-emerald-500/5',
                etapa.id === 'devolvido' && 'border-amber-500/30 bg-amber-500/5',
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">
                {etapa.label}
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-white md:text-3xl">
                {etapa.count.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-white/40">NFs</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-1000 ease-out',
                    etapa.cor,
                  )}
                  style={{ width: `${Math.min(100, etapa.percentual)}%` }}
                />
              </div>
              <p className="mt-2 text-right text-sm font-semibold tabular-nums text-white/70">
                {etapa.percentual.toLocaleString('pt-BR', {
                  maximumFractionDigits: 1,
                })}
                %
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
