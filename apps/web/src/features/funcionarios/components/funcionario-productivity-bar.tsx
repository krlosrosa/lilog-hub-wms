import { cn } from '@lilog/ui';

type FuncionarioProductivityBarProps = {
  value: number;
  className?: string;
  compact?: boolean;
};

function getBarColor(value: number) {
  if (value >= 80) return 'bg-accent';
  if (value >= 60) return 'bg-secondary';
  return 'bg-destructive';
}

function getTextColor(value: number) {
  if (value >= 80) return 'text-accent';
  if (value >= 60) return 'text-secondary';
  return 'text-destructive';
}

export function FuncionarioProductivityBar({
  value,
  className,
  compact = false,
}: FuncionarioProductivityBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <div className="h-1 w-10 overflow-hidden rounded-full bg-surface-highest">
          <div
            className={cn('h-full', getBarColor(clamped))}
            style={{ width: `${clamped}%` }}
            role="progressbar"
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <span
          className={cn('w-8 text-right text-xs font-semibold tabular-nums', getTextColor(clamped))}
        >
          {clamped}%
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-highest">
        <div
          className={cn('h-full transition-all', getBarColor(clamped))}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className={cn('text-label-md font-bold', getTextColor(clamped))}>
        {clamped}%
      </span>
    </div>
  );
}
