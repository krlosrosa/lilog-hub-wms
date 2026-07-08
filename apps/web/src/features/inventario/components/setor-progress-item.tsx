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
    <div
      className={cn(
        'flex gap-2.5 rounded-md px-1 py-1.5 transition-colors hover:bg-surface-highest/40',
        setor.opaco && 'opacity-75',
      )}
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-highest">
        <Icon className="size-3.5 text-muted-foreground" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex justify-between gap-2">
          <span className="truncate text-[11px] font-semibold text-foreground">
            {setor.nome}
          </span>
          <span
            className={cn(
              'shrink-0 text-[10px] font-semibold',
              LABEL_TONE[setor.statusTone],
            )}
          >
            {setor.statusLabel}
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-highest">
          <div
            className={cn('h-full rounded-full', BAR_TONE[setor.statusTone])}
            style={{ width: `${String(setor.progressPercent)}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>
            {setor.skuContados}/{setor.skuTotal} SKU
          </span>
          <span>
            {setor.acuraciaLabel !== null
              ? `Acur.: ${setor.acuraciaLabel}`
              : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
