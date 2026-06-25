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
  className,
}: DevolucaoKpiCardProps) {
  return (
    <div
      className={cn(
        'relative flex h-32 flex-col justify-between overflow-hidden rounded-xl border border-outline-variant bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass',
        variant === 'critical' &&
          'border-destructive/30 bg-destructive/5',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-label-md text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="flex items-end justify-between">
        <div className="text-headline-md font-bold text-foreground">{value}</div>
        {badge}
      </div>
      {progressPercent !== undefined && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
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
