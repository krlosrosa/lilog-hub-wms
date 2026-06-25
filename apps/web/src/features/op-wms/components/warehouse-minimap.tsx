'use client';

import { Ban, Maximize2, User } from 'lucide-react';

import { cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';

type WarehouseMinimapProps = {
  zoneLabel?: string;
  className?: string;
};

const RACK_LABELS = ['A-01', 'A-02', 'A-04', 'A-05', 'B-01', 'B-02', 'B-03', 'B-04', 'B-05'];

export function WarehouseMinimap({
  zoneLabel = 'Setor A',
  className,
}: WarehouseMinimapProps) {
  return (
    <div className={cn(glassPanelClassName, 'relative overflow-hidden rounded-2xl p-6', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-title-md font-semibold text-foreground">
          Zona Atual: {zoneLabel}
        </h3>
        <button
          type="button"
          className="flex items-center gap-1 text-label-sm text-primary hover:underline"
        >
          Ampliar <Maximize2 className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="relative grid aspect-square grid-cols-5 grid-rows-5 gap-2 rounded-lg border border-outline-variant bg-surface-low p-4">
        <div className="flex items-center justify-center rounded border border-primary/40 bg-primary/20 text-[8px] font-bold text-primary">
          A-01
        </div>
        <div className="flex items-center justify-center rounded border border-primary/40 bg-primary/20 text-[8px] font-bold text-primary">
          A-02
        </div>
        <div className="flex items-center justify-center rounded border border-primary bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.4)]">
          <User className="h-3.5 w-3.5 text-primary-foreground" aria-hidden />
        </div>
        <div className="flex items-center justify-center rounded border border-primary/40 bg-primary/20 text-[8px] font-bold text-primary">
          A-04
        </div>
        <div className="flex items-center justify-center rounded border border-primary/40 bg-primary/20 text-[8px] font-bold text-primary">
          A-05
        </div>

        <div className="col-span-5 flex h-4 gap-2">
          <div className="flex-1 rounded bg-outline-variant/30" />
          <div className="flex-1 rounded bg-outline-variant/30" />
          <div className="flex flex-1 items-center justify-center rounded bg-destructive/40">
            <Ban className="h-2.5 w-2.5 text-destructive" aria-hidden />
          </div>
          <div className="flex-1 rounded bg-outline-variant/30" />
          <div className="flex-1 rounded bg-outline-variant/30" />
        </div>

        {RACK_LABELS.slice(4).map((label) => (
          <div
            key={label}
            className="flex items-center justify-center rounded border border-primary/40 bg-primary/20 text-[8px] font-bold text-primary"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 text-caption text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-primary" />
          Sua Posição
        </div>
        <div className="flex items-center gap-2 text-caption text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-destructive" />
          Alerta/Obstrução
        </div>
      </div>
    </div>
  );
}
