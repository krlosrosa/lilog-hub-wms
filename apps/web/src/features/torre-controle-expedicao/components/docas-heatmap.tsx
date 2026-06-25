'use client';

import { Warehouse } from 'lucide-react';

import { cn } from '@lilog/ui';

import { HeatmapLegend } from '@/features/enderecos/components/heat-cell';
import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import type { DocaCelula } from '@/features/torre-controle-expedicao/types/torre-controle.schema';

const nivelStyles: Record<
  DocaCelula['nivel'],
  { bg: string; border: string; text: string; pulse?: boolean }
> = {
  livre: {
    bg: 'bg-surface-highest',
    border: 'border-outline-variant/30',
    text: 'text-muted-foreground',
  },
  parcial: {
    bg: 'bg-primary/30',
    border: 'border-primary/20',
    text: 'text-primary',
  },
  alto: {
    bg: 'bg-primary/60',
    border: 'border-primary/30',
    text: 'text-primary-foreground',
  },
  critico: {
    bg: 'bg-destructive/70',
    border: 'border-destructive/40',
    text: 'text-destructive-foreground',
    pulse: true,
  },
};

export type DocasHeatmapProps = {
  docas: DocaCelula[];
  onDocaClick: (docaId: string) => void;
  className?: string;
};

export function DocasHeatmap({ docas, onDocaClick, className }: DocasHeatmapProps) {
  return (
    <section
      id="docas-heatmap"
      className={cn(glassPanelClassName, 'rounded-xl p-4 md:p-6', className)}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Warehouse className="size-5 text-primary" aria-hidden />
          <h2 className="text-label-md font-semibold text-foreground">
            Heatmap de Docas
          </h2>
        </div>
        <HeatmapLegend compact />
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-12">
        {docas.map((doca) => {
          const style = nivelStyles[doca.nivel];

          return (
            <button
              key={doca.id}
              type="button"
              onClick={() => onDocaClick(doca.id)}
              aria-label={`Doca ${doca.label}, ${doca.transportesAtivos} transportes ativos`}
              className={cn(
                'flex h-12 flex-col items-center justify-center rounded-md border font-semibold transition-all hover:brightness-110 hover:scale-105',
                style.bg,
                style.border,
                style.text,
                style.pulse && 'animate-pulse',
              )}
            >
              <span className="text-xs">{doca.label}</span>
              {doca.transportesAtivos > 0 ? (
                <span className="text-[9px] font-normal opacity-90">
                  {doca.transportesAtivos} veíc.
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-caption text-muted-foreground">
        Clique em uma doca para ver transportes ativos e fila de espera.
      </p>
    </section>
  );
}
