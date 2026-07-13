'use client';

import { cn } from '@lilog/ui';
import { hapticLight } from '@/lib/haptics';

export type DemandaFilter = 'all' | 'disponivel' | 'atribuida' | 'em_conferencia' | 'impedido';

const FILTERS: Array<{ id: DemandaFilter; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'impedido', label: 'Impedidas' },
  { id: 'disponivel', label: 'Sem conferente' },
  { id: 'atribuida', label: 'Atribuídas' },
  { id: 'em_conferencia', label: 'Conferindo' },
];

type DemandasFilterChipsProps = {
  active: DemandaFilter;
  counts: Record<DemandaFilter, number>;
  onChange: (filter: DemandaFilter) => void;
};

function resolveChipClass(id: DemandaFilter, isActive: boolean, isUrgent: boolean) {
  if (!isActive) {
    if (id === 'impedido' && isUrgent) {
      return 'border border-orange-500/30 bg-orange-500/10 text-orange-700';
    }
    return 'bg-surface-container text-on-surface-variant';
  }

  if (id === 'impedido') {
    return 'bg-orange-500 text-white';
  }

  if (isUrgent) {
    return 'bg-error text-on-error';
  }

  return 'bg-secondary text-on-secondary';
}

function resolveBadgeClass(id: DemandaFilter, isActive: boolean) {
  if (!isActive) {
    return 'bg-outline-variant/30 text-on-surface-variant';
  }

  if (id === 'impedido') {
    return 'bg-white/20 text-white';
  }

  return 'bg-on-secondary/20 text-on-secondary';
}

export function DemandasFilterChips({
  active,
  counts,
  onChange,
}: DemandasFilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {FILTERS.map(({ id, label }) => {
        const isActive = active === id;
        const isUrgent =
          (id === 'disponivel' && counts.disponivel > 0) ||
          (id === 'impedido' && counts.impedido > 0);

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
              resolveChipClass(id, isActive, isUrgent),
            )}
          >
            {label}
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                resolveBadgeClass(id, isActive),
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
