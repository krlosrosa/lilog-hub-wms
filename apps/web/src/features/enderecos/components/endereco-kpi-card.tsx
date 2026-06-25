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
        'relative overflow-hidden rounded-xl border border-outline-variant bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass transition-transform hover:-translate-y-1',
        variant === 'critical' && 'border-destructive/30',
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        {icon}
        {badge}
      </div>
      <p className="mb-1 text-label-md text-muted-foreground">{label}</p>
      <p className="text-headline-md font-bold text-foreground">{value}</p>
      {progressPercent !== undefined && (
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted">
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
