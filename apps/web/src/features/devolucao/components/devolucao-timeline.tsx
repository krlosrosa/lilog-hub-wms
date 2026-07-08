'use client';

import { cn } from '@lilog/ui';

import type { TimelineStep } from '@/features/devolucao/types/devolucao-detalhes.schema';

type DevolucaoTimelineProps = {
  steps: readonly TimelineStep[];
  compact?: boolean;
  className?: string;
};

const DOT_STYLES: Record<TimelineStep['status'], string> = {
  completed: 'bg-tertiary border-background',
  active: 'bg-primary border-background ring-2 ring-primary/30',
  future: 'bg-outline border-background',
};

export function DevolucaoTimeline({
  steps,
  compact = false,
  className,
}: DevolucaoTimelineProps) {
  return (
    <div
      className={cn(
        'relative pl-5 before:absolute before:bottom-1 before:left-[7px] before:top-1 before:w-px before:bg-outline-variant',
        compact ? 'space-y-3' : 'space-y-6 pl-6 before:left-2 before:w-0.5',
        className,
      )}
    >
      {steps.map((step) => (
        <div
          key={step.id}
          className={cn('relative', step.status === 'future' && 'opacity-40')}
        >
          <div
            className={cn(
              'absolute rounded-full border-2',
              compact
                ? '-left-[18px] top-0.5 size-2.5 border-[3px]'
                : '-left-[22px] top-1 size-4 border-4',
              DOT_STYLES[step.status],
            )}
            aria-hidden
          />
          <p
            className={cn(
              'text-foreground',
              compact ? 'text-xs font-medium leading-tight' : 'text-label-md',
              step.status === 'active' && 'font-semibold text-primary',
            )}
          >
            {step.titulo}
          </p>
          <p
            className={cn(
              'text-muted-foreground',
              compact ? 'text-[11px] leading-snug' : 'text-caption',
              step.status === 'active' && 'italic',
            )}
          >
            {step.descricao}
          </p>
        </div>
      ))}
    </div>
  );
}
