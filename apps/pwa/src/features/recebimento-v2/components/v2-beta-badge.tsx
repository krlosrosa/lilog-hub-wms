import { cn } from '@lilog/ui';
import { FlaskConical } from 'lucide-react';

interface V2BetaBadgeProps {
  className?: string;
}

export function V2BetaBadge({ className }: V2BetaBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-tertiary/30 bg-tertiary-container px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-on-tertiary-container',
        className,
      )}
    >
      <FlaskConical className="h-2.5 w-2.5" aria-hidden />
      V2
    </span>
  );
}
