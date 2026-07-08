'use client';

import type { ReactNode } from 'react';

import { cn } from '@lilog/ui';

export type DevolucaoKpiCardProps = {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  badge?: ReactNode;
  progressPercent?: number;
  progressClassName?: string;
  variant?: 'default' | 'critical' | 'tertiary';
  footer?: ReactNode;
  size?: 'default' | 'compact';
  className?: string;
};

export function DevolucaoKpiCard({
  icon,
  label,
  value,
  badge,
  progressPercent,
  progressClassName = 'bg-primary',
  variant = 'default',
  footer,
  size = 'default',
  className,
}: DevolucaoKpiCardProps) {
  const isCompact = size === 'compact';

  return (
    <div
      className={cn(
        'relative flex flex-col justify-between overflow-hidden rounded-lg border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass',
        isCompact ? 'gap-1 p-3' : 'h-32 gap-0 p-6',
        variant === 'critical' &&
          'border-destructive/30 bg-destructive/5',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'truncate text-muted-foreground',
            isCompact ? 'text-[10px] font-medium uppercase tracking-wide' : 'text-label-md',
          )}
        >
          {label}
        </span>
        <span className="shrink-0">{icon}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div
          className={cn(
            'min-w-0 font-bold tabular-nums text-foreground',
            isCompact ? 'text-sm leading-tight' : 'text-headline-md',
          )}
        >
          {value}
        </div>
        {badge}
      </div>
      {progressPercent !== undefined && (
        <div
          className={cn(
            'w-full overflow-hidden rounded-full bg-muted',
            isCompact ? 'mt-1 h-0.5' : 'mt-2 h-1',
          )}
        >
          <div
            className={cn('h-full rounded-full', progressClassName)}
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          />
        </div>
      )}
      {footer}
    </div>
  );
}
