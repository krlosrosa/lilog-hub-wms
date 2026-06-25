import { cn } from '@lilog/ui';
import type { HTMLAttributes } from 'react';

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  label: string;
  pulse?: boolean;
  compact?: boolean;
}

export function StatusBadge({
  label,
  pulse = false,
  compact = false,
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-surface-container-high text-on-surface-variant',
        compact
          ? 'gap-0.5 px-1.5 py-0.5 text-[10px] font-medium leading-none'
          : 'gap-1 px-3 py-1 text-label-sm',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'shrink-0 rounded-full bg-on-tertiary-container',
          compact ? 'h-1.5 w-1.5' : 'h-2 w-2',
          pulse && 'animate-pulse'
        )}
      />
      {label}
    </span>
  );
}
