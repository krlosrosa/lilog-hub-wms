'use client';

import { cn } from '@lilog/ui';
import { hapticLight } from '@/lib/haptics';

import type { GestaoRecursosProcessoFilter } from '@/features/gestao-recursos/types/gestao-recursos.schema';

const PROCESSO_FILTERS: Array<{
  id: GestaoRecursosProcessoFilter;
  label: string;
}> = [
  { id: 'todos', label: 'Todos' },
  { id: 'operacional', label: 'Operacional' },
  { id: 'devolucao', label: 'Devolução' },
];

type GestaoRecursosProcessoChipsProps = {
  active: GestaoRecursosProcessoFilter;
  onChange: (filter: GestaoRecursosProcessoFilter) => void;
};

export function GestaoRecursosProcessoChips({
  active,
  onChange,
}: GestaoRecursosProcessoChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {PROCESSO_FILTERS.map(({ id, label }) => {
        const isActive = active === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              hapticLight();
              onChange(id);
            }}
            className={cn(
              'flex shrink-0 items-center rounded-full px-3 py-1.5 text-label-sm whitespace-nowrap transition-colors touch-manipulation active:scale-95',
              isActive
                ? 'bg-primary text-on-primary'
                : 'border border-outline-variant bg-surface text-on-surface-variant',
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
