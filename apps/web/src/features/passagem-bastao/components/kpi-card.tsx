'use client';

import type { LucideIcon } from 'lucide-react';

import { cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/passagem-bastao/components/passagem-bastao-panel-classes';

export type KpiCardVariant = 'tertiary' | 'destructive' | 'secondary';

export type KpiCardProps = {
  label: string;
  value: string;
  progressPercent: number;
  caption: string;
  variant: KpiCardVariant;
  icon: LucideIcon;
  pulse?: boolean;
  criticalBorder?: boolean;
};

const VARIANT_STYLES: Record<
  KpiCardVariant,
  { label: string; value: string; bar: string; icon: string }
> = {
  tertiary: {
    label: 'text-muted-foreground',
    value: 'text-tertiary',
    bar: 'bg-tertiary',
    icon: 'text-tertiary',
  },
  destructive: {
    label: 'text-destructive font-semibold',
    value: 'text-destructive',
    bar: 'bg-destructive',
    icon: 'text-destructive',
  },
  secondary: {
    label: 'text-muted-foreground',
    value: 'text-secondary',
    bar: 'bg-secondary',
    icon: 'text-secondary',
  },
};

export function KpiCard({
  label,
  value,
  progressPercent,
  caption,
  variant,
  icon: Icon,
  pulse = false,
  criticalBorder = false,
}: KpiCardProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className={cn(
        glassPanelClassName,
        'flex flex-col justify-between p-3.5',
        criticalBorder && 'border-destructive/30',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn('text-[11px] font-medium leading-tight', styles.label)}>
          {label}
        </span>
        <Icon
          className={cn('size-4 shrink-0', styles.icon, pulse && 'animate-pulse')}
          aria-hidden
        />
      </div>
      <div className="mt-2">
        <p
          className={cn(
            'text-xl font-semibold tabular-nums tracking-tight',
            styles.value,
            pulse && 'animate-pulse',
          )}
        >
          {value}
        </p>
        <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-surface-variant">
          <div
            className={cn('h-full', styles.bar, pulse && 'animate-pulse')}
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
        <p
          className={cn(
            'mt-1 text-[10px] leading-snug',
            variant === 'destructive'
              ? 'font-medium uppercase tracking-tight text-destructive'
              : 'text-muted-foreground',
          )}
        >
          {caption}
        </p>
      </div>
    </div>
  );
}
