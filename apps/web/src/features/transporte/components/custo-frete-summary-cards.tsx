'use client';

import { cn } from '@lilog/ui';
import { AlertTriangle, Clock, DollarSign, Scale, TrendingUp } from 'lucide-react';

import { formatarMoeda } from '@/features/transporte/lib/calcular-custo';
import type { CustoFreteSummary } from '@/features/transporte/types/transporte.schema';

type CustoFreteSummaryCardsProps = {
  summary: CustoFreteSummary;
  className?: string;
};

type StatItem = {
  label: string;
  value: string;
  subValue?: string;
  accent?: 'default' | 'destructive' | 'tertiary' | 'secondary' | 'primary';
  icon: typeof DollarSign;
};

function formatarPesoTon(pesoKg: number): string {
  const toneladas = pesoKg / 1000;
  return `${toneladas.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} t`;
}

export function CustoFreteSummaryCards({
  summary,
  className,
}: CustoFreteSummaryCardsProps) {
  const variacaoPositiva = summary.variacaoValor >= 0;
  const variacaoFormatada = `${variacaoPositiva ? '+' : ''}${formatarMoeda(summary.variacaoValor)}`;
  const percentualFormatado = `${variacaoPositiva ? '+' : ''}${summary.variacaoPercentual.toFixed(1)}%`;

  const items: StatItem[] = [
    {
      label: 'Total Previsto',
      value: formatarMoeda(summary.totalPrevisto),
      icon: DollarSign,
    },
    {
      label: 'Total Pago',
      value: formatarMoeda(summary.totalPago),
      accent: 'tertiary',
      icon: DollarSign,
    },
    {
      label: 'Variação',
      value: variacaoFormatada,
      subValue: percentualFormatado,
      accent: variacaoPositiva ? 'destructive' : 'tertiary',
      icon: TrendingUp,
    },
    {
      label: 'Pendentes',
      value: String(summary.pendentesLancamento),
      accent: summary.pendentesLancamento > 0 ? 'secondary' : 'default',
      icon: summary.pendentesLancamento > 0 ? AlertTriangle : Clock,
    },
    {
      label: 'R$/Ton',
      value: summary.custoPorTon > 0 ? formatarMoeda(summary.custoPorTon) : '—',
      subValue:
        summary.pesoTotalKg > 0
          ? `${formatarPesoTon(summary.pesoTotalKg)} · total`
          : 'Sem peso lançado',
      accent: 'primary',
      icon: Scale,
    },
  ];

  const valueColor: Record<NonNullable<StatItem['accent']>, string> = {
    default: 'text-foreground',
    destructive: 'text-destructive',
    tertiary: 'text-tertiary',
    secondary: 'text-secondary',
    primary: 'text-primary',
  };

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-2 lg:grid-cols-5',
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
              accent === 'destructive' && 'border-destructive/20',
            )}
          >
            <Icon
              className={cn(
                'pointer-events-none absolute -right-1 -top-1 size-8 opacity-[0.08]',
                accent === 'tertiary'
                  ? 'text-tertiary'
                  : accent === 'destructive'
                    ? 'text-destructive'
                    : accent === 'secondary'
                      ? 'text-secondary'
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
            {item.subValue ? (
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {item.subValue}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
