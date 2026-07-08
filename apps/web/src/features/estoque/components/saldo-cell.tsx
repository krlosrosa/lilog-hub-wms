'use client';

import { cn } from '@lilog/ui';

const nf = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

export function SaldoCell({
  value,
  tone = 'default',
  className,
}: {
  value: number;
  tone?: 'default' | 'positive' | 'warning' | 'critical' | 'muted';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'font-mono text-[11px] font-semibold tabular-nums',
        tone === 'positive' && 'text-tertiary',
        tone === 'warning' && value > 0 && 'text-amber-700 dark:text-amber-400',
        tone === 'critical' && value > 0 && 'text-destructive',
        tone === 'muted' && 'text-muted-foreground',
        tone === 'default' && 'text-foreground',
        className,
      )}
    >
      {nf.format(value)}
    </span>
  );
}

export { nf as formatSaldoNumber };
