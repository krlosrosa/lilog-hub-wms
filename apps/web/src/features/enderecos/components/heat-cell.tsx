'use client';

import { cn } from '@lilog/ui';

import type { HeatCell } from '@/features/enderecos/types/enderecos-mapa-calor.schema';

const nivelStyles: Record<
  HeatCell['nivel'],
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

export type HeatCellButtonProps = {
  cell: HeatCell;
  selected?: boolean;
  compact?: boolean;
  onSelect: (cell: HeatCell) => void;
};

export function HeatCellButton({
  cell,
  selected,
  compact = false,
  onSelect,
}: HeatCellButtonProps) {
  const style = nivelStyles[cell.nivel];

  return (
    <button
      type="button"
      onClick={() => onSelect(cell)}
      aria-label={`Endereço ${cell.label}, ocupação ${cell.ocupacaoPercent}%`}
      aria-pressed={selected}
      className={cn(
        'flex items-center justify-center rounded-sm border font-medium transition-all hover:brightness-110',
        compact
          ? 'h-6 min-w-0 text-[7px] leading-none hover:scale-[1.03]'
          : 'h-10 text-[8px] hover:scale-105',
        style.bg,
        style.border,
        style.text,
        style.pulse && 'animate-pulse',
        selected && 'z-20 ring-1 ring-primary ring-offset-1 ring-offset-background',
      )}
    >
      <span className="truncate px-0.5">{cell.label}</span>
    </button>
  );
}

export type HeatmapLegendProps = {
  className?: string;
  compact?: boolean;
};

export function HeatmapLegend({ className, compact }: HeatmapLegendProps) {
  const items = [
    { label: 'Livre', className: 'bg-surface-highest border-outline-variant/30' },
    { label: 'Parcial', className: 'bg-primary/40 border-primary/20' },
    { label: 'Crítico', className: 'bg-destructive/60 border-destructive/30' },
  ] as const;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center',
        compact ? 'gap-2 md:gap-3' : 'gap-4 md:gap-6',
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div
            className={cn(
              'rounded border',
              compact ? 'size-2.5' : 'size-4',
              item.className,
            )}
            aria-hidden
          />
          <span
            className={cn(
              'text-muted-foreground',
              compact ? 'text-[10px]' : 'text-caption',
            )}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
