'use client';

import { cn } from '@lilog/ui';

type DockSlot = {
  numero: number;
  status: 'ativa' | 'livre' | 'critica' | 'finalizada';
};

type DevolucaoDockGridProps = {
  slots: readonly DockSlot[];
  className?: string;
};

const SLOT_STYLES: Record<
  DockSlot['status'],
  { container: string; text: string }
> = {
  ativa: {
    container:
      'border-tertiary/30 bg-tertiary/10 hover:bg-tertiary/20',
    text: 'text-tertiary',
  },
  livre: {
    container:
      'border-outline-variant bg-muted hover:bg-surface-high',
    text: 'text-muted-foreground',
  },
  critica: {
    container:
      'border-destructive/30 bg-destructive/10 hover:bg-destructive/20',
    text: 'text-destructive',
  },
  finalizada: {
    container:
      'border-outline-variant bg-muted opacity-50 hover:bg-surface-high',
    text: 'text-muted-foreground',
  },
};

export function DevolucaoDockGrid({ slots, className }: DevolucaoDockGridProps) {
  return (
    <div className={cn('grid grid-cols-5 gap-3', className)}>
      {slots.map((slot) => {
        const styles = SLOT_STYLES[slot.status];
        return (
          <button
            key={slot.numero}
            type="button"
            className={cn(
              'relative flex aspect-square cursor-pointer items-center justify-center rounded border transition-transform hover:scale-105',
              styles.container,
            )}
            aria-label={`Doca ${String(slot.numero).padStart(2, '0')} — ${slot.status}`}
          >
            <span
              className={cn('font-mono text-caption font-bold', styles.text)}
            >
              {String(slot.numero).padStart(2, '0')}
            </span>
          </button>
        );
      })}
    </div>
  );
}
