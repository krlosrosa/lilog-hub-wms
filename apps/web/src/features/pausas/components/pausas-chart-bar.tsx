'use client';

import type { ChartDia } from '@/features/pausas/types/pausas.schema';

import { glassPanelClassName } from '@/features/pausas/components/pausas-panel-classes';

export type PausasChartBarProps = {
  data: ChartDia[];
};

export function PausasChartBar({ data }: PausasChartBarProps) {
  return (
    <div className={`${glassPanelClassName} flex flex-col gap-6 p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-headline-md font-semibold text-foreground">
            Tempo Produtivo vs Pausa
          </h3>
          <p className="text-caption text-muted-foreground">
            Distribuição semanal consolidada por hora
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-sm bg-tertiary" />
            <span className="text-caption text-muted-foreground">Produtivo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-sm bg-secondary" />
            <span className="text-caption text-muted-foreground">Pausa</span>
          </div>
        </div>
      </div>

      <div className="flex h-64 items-end justify-between gap-2 px-2">
        {data.map((dia) => (
          <div
            key={dia.dia}
            className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            <div className="flex h-full w-full flex-col items-center justify-end gap-1">
              <div
                className="w-8 rounded-t-sm bg-secondary opacity-80 transition-opacity group-hover:opacity-100"
                style={{ height: `${dia.pausaPercent}%` }}
              />
              <div
                className="w-8 rounded-t-sm bg-tertiary opacity-80 transition-opacity group-hover:opacity-100"
                style={{ height: `${dia.produtivoPercent}%` }}
              />
            </div>
            <span className="text-caption text-muted-foreground">{dia.dia}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
