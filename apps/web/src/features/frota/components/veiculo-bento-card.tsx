'use client';

import type { ReactNode } from 'react';

import { cn } from '@lilog/ui';

type VeiculoBentoCardProps = {
  label: string;
  value: ReactNode;
  subtext?: string;
  icon?: ReactNode;
  variant?: 'default' | 'destructive';
  footer?: ReactNode;
  className?: string;
};

export function VeiculoBentoCard({
  label,
  value,
  subtext,
  icon,
  variant = 'default',
  footer,
  className,
}: VeiculoBentoCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col justify-between rounded-lg border border-outline-variant bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass transition-colors hover:border-primary/40',
        variant === 'destructive' && 'border-l-4 border-l-destructive',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-label-sm uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {icon ? (
          <span
            className={cn(
              'text-muted-foreground',
              variant === 'destructive' && 'text-destructive',
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-4">
        <div
          className={cn(
            'text-headline-lg font-semibold tracking-tight text-primary',
            variant === 'destructive' && 'text-destructive',
          )}
        >
          {value}
        </div>
        {subtext ? (
          <p className="mt-1 text-label-sm text-muted-foreground">{subtext}</p>
        ) : null}
        {footer}
      </div>
    </div>
  );
}
