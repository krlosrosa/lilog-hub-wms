'use client';

import type { ReactNode } from 'react';

import { cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/pausas/components/pausas-panel-classes';

export type KpiCardProps = {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  badge?: ReactNode;
  variant?: 'default' | 'critical' | 'tertiary';
  footer?: ReactNode;
  progressPercent?: number;
  progressClassName?: string;
  className?: string;
};

export function KpiCard({
  icon,
  label,
  value,
  badge,
  variant = 'default',
  footer,
  progressPercent,
  progressClassName = 'bg-primary',
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        glassPanelClassName,
        'relative flex min-h-32 flex-col justify-between p-6',
        variant === 'critical' && 'border-destructive/30 bg-destructive/5',
        variant === 'tertiary' && 'border-tertiary/30',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-label-md text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="flex items-end justify-between gap-2">
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
