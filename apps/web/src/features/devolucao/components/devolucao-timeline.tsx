'use client';

import { cn } from '@lilog/ui';

import type { TimelineStep } from '@/features/devolucao/types/devolucao-detalhes.schema';

type DevolucaoTimelineProps = {
  steps: readonly TimelineStep[];
  className?: string;
};

const DOT_STYLES: Record<TimelineStep['status'], string> = {
  completed: 'bg-tertiary border-background',
  active: 'bg-primary border-background ring-2 ring-primary/30',
  future: 'bg-outline border-background',
};

export function DevolucaoTimeline({ steps, className }: DevolucaoTimelineProps) {
  return (
    <div
      className={cn(
        'relative space-y-6 pl-6 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-0.5 before:bg-outline-variant',
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
              'absolute -left-[22px] top-1 size-4 rounded-full border-4',
              DOT_STYLES[step.status],
            )}
            aria-hidden
          />
          <p
            className={cn(
              'text-label-md text-foreground',
              step.status === 'active' && 'font-bold text-primary',
            )}
          >
            {step.titulo}
          </p>
          <p
            className={cn(
              'text-caption text-muted-foreground',
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
