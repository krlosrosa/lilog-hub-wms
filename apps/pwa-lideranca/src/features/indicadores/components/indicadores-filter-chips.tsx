'use client';

import { cn } from '@lilog/ui';
import { hapticLight } from '@/lib/haptics';

import type { FiltroRapidoTorre } from '@/features/indicadores/lib/torre-controle.schema';
import { FILTRO_RAPIDO_TORRE_LABELS } from '@/features/indicadores/lib/torre-controle.schema';

const FILTERS: FiltroRapidoTorre[] = [
  'todos',
  'prioritarios',
  'atrasados',
  'criticos',
  'prioritarios_atrasados',
];

type IndicadoresFilterChipsProps = {
  active: FiltroRapidoTorre;
  counts: Record<FiltroRapidoTorre, number>;
  onChange: (filter: FiltroRapidoTorre) => void;
  disabled?: boolean;
};

export function IndicadoresFilterChips({
  active,
  counts,
  onChange,
  disabled,
}: IndicadoresFilterChipsProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 hide-scrollbar snap-x snap-mandatory">
      {FILTERS.map((id) => {
        const isActive = active === id;
        const isCritical =
          (id === 'prioritarios_atrasados' && counts.prioritarios_atrasados > 0) ||
          (id === 'criticos' && counts.criticos > 0);

        return (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => {
              hapticLight();
              onChange(id);
            }}
            className={cn(
              'flex shrink-0 snap-start items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap shadow-sm transition-all touch-manipulation active:scale-95 disabled:opacity-50',
              isActive
                ? isCritical
                  ? 'bg-destructive text-on-destructive shadow-destructive/20'
                  : 'bg-secondary text-on-secondary shadow-secondary/20'
                : 'border border-outline-variant/60 bg-surface text-on-surface-variant',
            )}
          >
            {FILTRO_RAPIDO_TORRE_LABELS[id]}
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                isActive
                  ? isCritical
                    ? 'bg-on-destructive/20 text-on-destructive'
                    : 'bg-on-secondary/20 text-on-secondary'
                  : 'bg-surface-container text-on-surface-variant',
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
