import { cn } from '@lilog/ui';
import { CheckCircle2 } from 'lucide-react';

import {
  RASTREIO_TIMELINE,
  type RastreioStatus,
} from '@/features/rastreio/types/rastreio.schema';

interface RastreioTimelineProps {
  status: RastreioStatus;
  timelineIndex: number;
}

export function RastreioTimeline({ status, timelineIndex }: RastreioTimelineProps) {
  return (
    <ol className="relative space-y-0">
      {RASTREIO_TIMELINE.map((step, index) => {
        const isDone = index < timelineIndex;
        const isCurrent = index === timelineIndex && !status.finalizado;
        const isLast = index === RASTREIO_TIMELINE.length - 1;

        return (
          <li key={step.situacao} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast ? (
              <span
                aria-hidden
                className={cn(
                  'absolute left-[15px] top-8 h-[calc(100%-12px)] w-0.5 -translate-x-1/2',
                  isDone ? 'bg-secondary' : 'bg-outline-variant/60',
                )}
              />
            ) : null}
            <span
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold',
                isCurrent
                  ? 'border-secondary bg-secondary text-on-secondary ring-4 ring-secondary/15'
                  : isDone
                    ? 'border-secondary bg-secondary text-on-secondary'
                    : 'border-outline-variant bg-surface text-on-surface-variant',
              )}
            >
              {isDone && !isCurrent ? (
                <CheckCircle2 className="size-4" aria-hidden />
              ) : (
                index + 1
              )}
            </span>
            <div className="min-w-0 pt-1">
              <p
                className={cn(
                  'text-sm leading-tight',
                  isCurrent
                    ? 'font-semibold text-on-background'
                    : isDone
                      ? 'font-medium text-on-background'
                      : 'text-on-surface-variant',
                )}
              >
                {step.label}
              </p>
              {isCurrent ? (
                <p className="mt-0.5 text-label-sm text-secondary">Etapa atual</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
