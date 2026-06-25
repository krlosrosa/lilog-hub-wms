import { cn } from '@lilog/ui';

interface TurnoStatusRingProps {
  percent: number;
  size?: 'sm' | 'lg';
  className?: string;
  /** Ring stroke on accent surfaces (e.g. secondary-container card) */
  variant?: 'default' | 'on-accent';
}

const SIZES = {
  sm: { box: 'h-14 w-14', r: 24, stroke: 5, text: 'text-label-md' },
  lg: { box: 'h-24 w-24', r: 40, stroke: 8, text: 'text-headline-md' },
} as const;

export function TurnoStatusRing({
  percent,
  size = 'lg',
  className,
  variant = 'default',
}: TurnoStatusRingProps) {
  const config = SIZES[size];
  const circumference = 2 * Math.PI * config.r;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = circumference - (clamped / 100) * circumference;
  const viewBox = config.r * 2 + config.stroke;

  return (
    <div
      className={cn('relative flex shrink-0 items-center justify-center', config.box, className)}
      role="img"
      aria-label={`${Math.round(clamped)}% do checklist concluído`}
    >
      <svg
        className="h-full w-full -rotate-90"
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        aria-hidden
      >
        <circle
          cx={viewBox / 2}
          cy={viewBox / 2}
          r={config.r}
          fill="transparent"
          className={
            variant === 'on-accent'
              ? 'stroke-on-secondary-container/25'
              : 'stroke-surface-container'
          }
          strokeWidth={config.stroke}
        />
        <circle
          cx={viewBox / 2}
          cy={viewBox / 2}
          r={config.r}
          fill="transparent"
          className={
            variant === 'on-accent' ? 'stroke-on-secondary-container' : 'stroke-secondary'
          }
          strokeWidth={config.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span
        className={cn(
          'absolute font-mono font-bold tabular-nums',
          config.text,
          variant === 'on-accent' ? 'text-on-secondary-container' : 'text-on-surface',
        )}
      >
        {Math.round(clamped)}%
      </span>
    </div>
  );
}
