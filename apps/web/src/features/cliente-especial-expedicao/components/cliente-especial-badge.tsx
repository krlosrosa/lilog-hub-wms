import { cn } from '@lilog/ui';
import { AlertTriangle } from 'lucide-react';

type ClienteEspecialBadgeProps = {
  className?: string;
  compact?: boolean;
};

export function ClienteEspecialBadge({
  className,
  compact = false,
}: ClienteEspecialBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300',
        className,
      )}
    >
      <AlertTriangle className={compact ? 'size-3' : 'size-3.5'} aria-hidden />
      {compact ? 'Especial' : 'Cliente especial'}
    </span>
  );
}
