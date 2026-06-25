'use client';

import { cn } from '@lilog/ui';

import {
  RESSUPRIMENTO_PRIORITY_LABELS,
  type RessuprimentoPriority,
} from '@/features/op-wms/types/op-wms.schema';

const PRIORITIES: RessuprimentoPriority[] = ['alta', 'critica', 'backlog'];

const PRIORITY_DOT: Record<RessuprimentoPriority, string> = {
  alta: 'bg-secondary',
  critica: 'bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.5)]',
  backlog: 'bg-outline',
};

type PrioritySelectorProps = {
  value: RessuprimentoPriority;
  onChange: (priority: RessuprimentoPriority) => void;
  compact?: boolean;
};

export function PrioritySelector({ value, onChange, compact = false }: PrioritySelectorProps) {
  return (
    <div
      className={cn('grid gap-1.5', compact ? 'grid-cols-1' : 'grid-cols-1 gap-2')}
      role="group"
      aria-label="Prioridade da operação"
    >
      {PRIORITIES.map((priority) => {
        const isSelected = value === priority;
        return (
          <button
            key={priority}
            type="button"
            onClick={() => onChange(priority)}
            className={cn(
              'flex items-center justify-between rounded-md font-bold transition-all',
              compact ? 'px-2.5 py-2 text-caption' : 'rounded-lg p-4 text-label-md',
              isSelected
                ? 'border-2 border-primary bg-primary/10 text-primary'
                : 'border border-outline-variant hover:bg-surface-high',
            )}
          >
            <span>{RESSUPRIMENTO_PRIORITY_LABELS[priority]}</span>
            <span
              className={cn('h-2 w-2 rounded-full', PRIORITY_DOT[priority])}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}
