'use client';

import { Layers, LayoutGrid, Snowflake } from 'lucide-react';

import { cn } from '@lilog/ui';

import type { SetorProgresso } from '@/features/inventario/types/inventario-detalhe.schema';

export type SetorProgressItemProps = {
  setor: SetorProgresso;
};

const ICONS = {
  snow: Snowflake,
  grid: LayoutGrid,
  layers: Layers,
};

const LABEL_TONE = {
  accent: 'text-accent',
  primary: 'text-primary',
  muted: 'text-muted-foreground',
} as const;

const BAR_TONE = {
  accent: 'bg-accent',
  primary: 'bg-primary',
  muted: 'bg-outline-variant',
} as const;

export function SetorProgressItem({ setor }: SetorProgressItemProps) {
  const Icon = ICONS[setor.iconName];

  return (
    <div className={cn('flex gap-4 md:gap-5', setor.opaco && 'opacity-80')}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-highest md:size-11">
        <Icon className="size-4 text-muted-foreground md:size-[18px]" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex justify-between gap-2 md:mb-2">
          <span className="text-sm font-semibold text-foreground">
            {setor.nome}
          </span>
          <span
            className={cn(
              'text-caption font-bold md:text-xs',
              LABEL_TONE[setor.statusTone],
            )}
          >
            {setor.statusLabel}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-highest md:h-2">
          <div
            className={cn(
              'h-full rounded-full',
              BAR_TONE[setor.statusTone],
            )}
            style={{ width: `${String(setor.progressPercent)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between">
          <span className="font-caption text-muted-foreground">
            {setor.skuContados}/{setor.skuTotal} SKU
          </span>
          <span className="font-caption text-muted-foreground">
            {setor.acuraciaLabel !== null
              ? `Acurácia: ${setor.acuraciaLabel}`
              : '---'}
          </span>
        </div>
      </div>
    </div>
  );
}
