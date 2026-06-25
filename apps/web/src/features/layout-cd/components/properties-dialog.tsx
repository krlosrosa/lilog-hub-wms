'use client';

import { Columns3, Info, RotateCcw, Trash2 } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';

import { fieldLabelClassName } from '@/features/layout-cd/components/layout-cd-panel-classes';
import type {
  CanvasItem,
  RackPropertiesForm,
} from '@/features/layout-cd/types/layout-cd.schema';

type PropertiesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CanvasItem | null;
  form: UseFormReturn<RackPropertiesForm>;
  floorPressurePercent: number;
  onReset: () => void;
  onRemove: () => void;
  onOpenConfig?: () => void;
};

export function PropertiesDialog({
  open,
  onOpenChange,
  item,
  form,
  floorPressurePercent,
  onReset,
  onRemove,
  onOpenConfig,
}: PropertiesDialogProps) {
  const { register, watch } = form;
  const loadLevels = watch('loadLevels');

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>Propriedades</DialogTitle>
            <span className="rounded bg-primary/10 px-2 py-1 font-mono text-[10px] font-bold text-primary">
              ACTIVE
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <button
            type="button"
            onClick={onOpenConfig}
            className="flex w-full gap-4 rounded-xl border border-outline-variant bg-surface-low p-4 text-left transition-colors hover:border-primary/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded border border-secondary/30 bg-secondary/10">
              <Columns3 className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">
                {item.label}
              </p>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">
                Type: {item.type}
              </p>
            </div>
          </button>

          <div className="space-y-4">
            <div>
              <label className={fieldLabelClassName}>Níveis de Carga</label>
              <div className="relative mt-2">
                <input
                  type="number"
                  className="w-full rounded-lg border border-outline-variant bg-surface-lowest px-4 py-2 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  {...register('loadLevels')}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-outline">
                  levels
                </span>
              </div>
            </div>

            <div>
              <label className={fieldLabelClassName}>Capacidade (Ton)</label>
              <div className="relative mt-2">
                <input
                  type="text"
                  className="w-full rounded-lg border border-outline-variant bg-surface-lowest px-4 py-2 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  {...register('capacityTon')}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-outline">
                  ton/level
                </span>
              </div>
            </div>

            <div>
              <label className={fieldLabelClassName}>Profundidade (mm)</label>
              <div className="relative mt-2">
                <input
                  type="number"
                  className="w-full rounded-lg border border-outline-variant bg-surface-lowest px-4 py-2 text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  {...register('depthMm')}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-outline">
                  mm
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-2"
                onClick={onReset}
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={onRemove}
              >
                <Trash2 className="h-4 w-4" />
                Remover
              </Button>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium text-foreground">
                Engineering Analysis
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-muted-foreground">Floor Pressure</span>
                <span className="text-status-active">OPTIMAL (4.2 kN/m²)</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-lowest">
                <div
                  className="h-full bg-status-active/50"
                  style={{ width: `${floorPressurePercent}%` }}
                />
              </div>
              <p className="font-mono text-[10px] text-muted-foreground">
                {loadLevels} níveis configurados
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
