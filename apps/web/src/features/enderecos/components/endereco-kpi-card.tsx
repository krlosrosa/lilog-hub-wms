'use client';

import type { ReactNode } from 'react';

import { cn } from '@lilog/ui';

export type EnderecoKpiCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  badge?: ReactNode;
  progressPercent?: number;
  progressClassName?: string;
  variant?: 'default' | 'critical' | 'tertiary';
  footer?: ReactNode;
  className?: string;
};

export function EnderecoKpiCard({
  icon,
  label,
  value,
  badge,
  progressPercent,
  progressClassName = 'bg-primary',
  variant = 'default',
  footer,
  className,
}: EnderecoKpiCardProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col justify-between gap-2 overflow-hidden rounded-xl border border-outline-variant bg-glass-bg p-4 shadow-inner-glow backdrop-blur-glass',
        variant === 'critical' && 'border-destructive/30 bg-destructive/5',
        variant === 'tertiary' && 'border-tertiary/30',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="text-xl font-bold tabular-nums tracking-tight text-foreground">
          {value}
        </p>
        {badge}
      </div>
      {progressPercent !== undefined && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
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
