'use client';

import { cn } from '@lilog/ui';

export type EntregaRingChartProps = {
  percentual: number;
  label?: string;
  sublabel?: string;
  size?: 'md' | 'lg';
  className?: string;
};

export function EntregaRingChart({
  percentual,
  label = 'Entrega',
  sublabel,
  size = 'lg',
  className,
}: EntregaRingChartProps) {
  const clamped = Math.min(100, Math.max(0, percentual));
  const stroke = size === 'lg' ? 12 : 8;
  const dim = size === 'lg' ? 160 : 120;
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg
          width={dim}
          height={dim}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--outline-variant) / 0.35)"
            strokeWidth={stroke}
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--tertiary))"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out drop-shadow-[0_0_12px_hsl(var(--tertiary)/0.6)]"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              'font-bold tabular-nums text-white',
              size === 'lg' ? 'text-4xl md:text-5xl' : 'text-3xl',
            )}
          >
            {clamped.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
          </span>
          <span className="text-xs font-medium uppercase tracking-widest text-white/50">
            {label}
          </span>
        </div>
      </div>
      {sublabel ? (
        <p className="mt-2 text-sm text-white/50">{sublabel}</p>
      ) : null}
    </div>
  );
}
