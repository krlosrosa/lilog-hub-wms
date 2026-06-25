import { cn } from '@lilog/ui';
import { Zap } from 'lucide-react';
import type { HTMLAttributes } from 'react';

interface PriorityBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  compact?: boolean;
}

export function PriorityBadge({ compact = true, className, ...props }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full bg-warning-container font-semibold text-on-warning-container',
        compact
          ? 'gap-0.5 px-1.5 py-0.5 text-[10px] leading-none'
          : 'gap-1 px-2 py-0.5 text-label-sm',
        className
      )}
      {...props}
    >
      <Zap
        className={cn('shrink-0 fill-warning text-warning', compact ? 'h-2.5 w-2.5' : 'h-3 w-3')}
        aria-hidden
      />
      Prioritário
    </span>
  );
}
