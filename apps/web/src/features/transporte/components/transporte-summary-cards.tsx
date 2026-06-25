'use client';

import { cn } from '@lilog/ui';
import { Container, Package, Truck } from 'lucide-react';

import type { TransporteSummary } from '@/features/transporte/types/transporte.schema';

const nf = new Intl.NumberFormat('pt-BR');

type TransporteSummaryCardsProps = {
  summary: TransporteSummary;
  className?: string;
};

type StatItem = {
  label: string;
  value: string;
  accent?: 'default' | 'destructive' | 'tertiary' | 'secondary';
  icon: typeof Package;
};

export function TransporteSummaryCards({
  summary,
  className,
}: TransporteSummaryCardsProps) {
  const items: StatItem[] = [
    {
      label: 'Remessas',
      value: nf.format(summary.totalRemessas),
      icon: Package,
    },
    {
      label: 'Pendentes',
      value: nf.format(summary.transportesPendentes),
      accent: 'destructive',
      icon: Container,
    },
    {
      label: 'Alocadas',
      value: nf.format(summary.placasAlocadas),
      accent: 'tertiary',
      icon: Truck,
    },
  ];

  const valueColor: Record<NonNullable<StatItem['accent']>, string> = {
    default: 'text-foreground',
    destructive: 'text-destructive',
    tertiary: 'text-tertiary',
    secondary: 'text-secondary',
  };

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-2 sm:grid-cols-3',
        className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const accent = item.accent ?? 'default';

        return (
          <div
            key={item.label}
            className={cn(
              'group relative overflow-hidden rounded-lg border border-outline-variant',
              'bg-glass-bg px-3 py-2.5 shadow-inner-glow backdrop-blur-glass',
              'transition-colors hover:border-primary/25',
              accent === 'tertiary' && 'border-tertiary/20',
            )}
          >
            <Icon
              className={cn(
                'pointer-events-none absolute -right-1 -top-1 size-8 opacity-[0.08]',
                accent === 'tertiary'
                  ? 'text-tertiary'
                  : accent === 'destructive'
                    ? 'text-destructive'
                    : 'text-primary',
              )}
              aria-hidden
            />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {item.label}
            </p>
            <p
              className={cn(
                'mt-0.5 truncate font-mono text-sm font-bold leading-tight',
                valueColor[accent],
              )}
            >
              {item.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
