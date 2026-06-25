'use client';

import { cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import type { EtapaPipeline } from '@/features/dashboard-operacional/types/dashboard-operacional.schema';

export type VolumeBreakdownProps = {
  etapas: EtapaPipeline[];
  className?: string;
};

export function VolumeBreakdown({ etapas, className }: VolumeBreakdownProps) {
  return (
    <section
      className={cn(glassPanelClassName, 'p-4 md:p-5', className)}
      aria-label="Volume por etapa operacional"
    >
      <header className="mb-4">
        <h2 className="text-label-md font-semibold text-foreground">
          Volume por Etapa
        </h2>
        <p className="mt-1 text-caption text-muted-foreground">
          Progressão do volume do dia nas etapas operacionais
        </p>
      </header>

      <div className="space-y-3">
        {etapas.map((etapa) => (
          <div key={etapa.id} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-caption">
              <span className="font-medium text-foreground">{etapa.label}</span>
              <span className="tabular-nums text-muted-foreground">
                {etapa.count.toLocaleString('pt-BR')} NFs ·{' '}
                {etapa.percentual.toLocaleString('pt-BR', {
                  maximumFractionDigits: 1,
                })}
                %
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  etapa.cor,
                )}
                style={{ width: `${Math.min(100, etapa.percentual)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
