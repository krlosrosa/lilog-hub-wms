import { cn } from '@lilog/ui';

import { hapticLight } from '@/lib/haptics';

interface AreaFilterChipProps {
  label: string;
  count?: number;
  active?: boolean;
  onClick: () => void;
}

export function AreaFilterChip({ label, count, active, onClick }: AreaFilterChipProps) {
  return (
    <button
      type="button"
      onClick={() => {
        hapticLight();
        onClick();
      }}
      aria-pressed={active ?? false}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5',
        'text-label-sm whitespace-nowrap transition-colors touch-manipulation active:scale-95',
        active
          ? 'bg-secondary text-on-secondary'
          : 'bg-surface-container text-on-surface-variant',
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
            active
              ? 'bg-on-secondary/20 text-on-secondary'
              : 'bg-outline-variant/30 text-on-surface-variant',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
