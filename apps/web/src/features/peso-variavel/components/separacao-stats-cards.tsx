'use client';

import { Container, Package, Truck } from 'lucide-react';

import { cn } from '@lilog/ui';

export type SeparacaoStats = {
  totalTransportes: number;
  totalRemessas: number;
  totalCaixas: number;
};

type SeparacaoStatsCardsProps = {
  stats: SeparacaoStats;
  className?: string;
};

const formatNumber = new Intl.NumberFormat('pt-BR');

function StatCard({
  label,
  value,
  icon: Icon,
  accentClassName,
}: {
  label: string;
  value: number;
  icon: typeof Truck;
  accentClassName: string;
}) {
  return (
    <article
      className={cn(
        'rounded-lg border border-outline-variant bg-card p-3 shadow-sm',
        accentClassName,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
        {formatNumber.format(value)}
      </p>
    </article>
  );
}

export function SeparacaoStatsCards({ stats, className }: SeparacaoStatsCardsProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 sm:grid-cols-3',
        className,
      )}
    >
      <StatCard
        label="Transportes"
        value={stats.totalTransportes}
        icon={Truck}
        accentClassName="border-l-2 border-l-primary"
      />
      <StatCard
        label="Remessas"
        value={stats.totalRemessas}
        icon={Package}
        accentClassName="border-l-2 border-l-secondary"
      />
      <StatCard
        label="Total de Caixas"
        value={stats.totalCaixas}
        icon={Container}
        accentClassName="border-l-2 border-l-tertiary"
      />
    </div>
  );
}
