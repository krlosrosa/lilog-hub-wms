import type { LucideIcon } from 'lucide-react';
import { ArrowUp } from 'lucide-react';

import { cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/funcionarios/components/funcionario-form-field-classes';

type FuncionarioStatsCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  trendPercent?: number;
  progressPercent?: number;
  iconClassName?: string;
  progressClassName?: string;
};

export function FuncionarioStatsCard({
  icon: Icon,
  label,
  value,
  trendPercent,
  progressPercent,
  iconClassName,
  progressClassName = 'bg-primary',
}: FuncionarioStatsCardProps) {
  return (
    <div
      className={cn(
        glassPanelClassName,
        'flex flex-col gap-3 p-4 shadow-inner-glow',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary',
              iconClassName,
            )}
          >
            <Icon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-caption font-medium text-muted-foreground">
              {label}
            </p>
            <p className="truncate text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              {value}
            </p>
          </div>
        </div>
        {trendPercent !== undefined && (
          <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
            <ArrowUp className="size-3" aria-hidden />
            {trendPercent}%
          </span>
        )}
      </div>
      {progressPercent !== undefined && (
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-surface-high"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${progressPercent}%`}
        >
          <div
            className={cn('h-full transition-all', progressClassName)}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}
