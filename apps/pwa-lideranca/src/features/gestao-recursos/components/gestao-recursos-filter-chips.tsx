'use client';

import { cn } from '@lilog/ui';
import { hapticLight } from '@/lib/haptics';

import type { GestaoRecursosFilter } from '@/features/gestao-recursos/types/gestao-recursos.schema';

const FILTERS: Array<{ id: GestaoRecursosFilter; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'atuando', label: 'Atuando' },
  { id: 'precisa_pausa', label: 'Precisa pausa' },
  { id: 'em_pausa', label: 'Em pausa' },
  { id: 'ociosos', label: 'Disponíveis' },
];

type GestaoRecursosFilterChipsProps = {
  active: GestaoRecursosFilter;
  counts: Record<GestaoRecursosFilter, number>;
  onChange: (filter: GestaoRecursosFilter) => void;
};

export function GestaoRecursosFilterChips({
  active,
  counts,
  onChange,
}: GestaoRecursosFilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {FILTERS.map(({ id, label }) => {
        const isActive = active === id;
        const isWarning = id === 'precisa_pausa' && counts.precisa_pausa > 0;

        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              hapticLight();
              onChange(id);
            }}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-label-sm whitespace-nowrap transition-colors touch-manipulation active:scale-95',
              isActive
                ? isWarning
                  ? 'bg-warning text-on-warning'
                  : 'bg-secondary text-on-secondary'
                : 'bg-surface-container text-on-surface-variant',
            )}
          >
            {label}
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                isActive
                  ? 'bg-on-secondary/20 text-on-secondary'
                  : 'bg-outline-variant/30 text-on-surface-variant',
              )}
            >
              {counts[id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
