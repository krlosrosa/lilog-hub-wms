'use client';

import type { ReactNode } from 'react';

import { cn } from '@lilog/ui';
import { Building2, Truck, TruckIcon, XCircle } from 'lucide-react';

type TransportadoraStatsCardsProps = {
  total: number;
  ativas: number;
  inativas: number;
  totalVeiculos: number;
};

function StatCard({
  extra,
  children,
}: {
  extra?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-outline-variant bg-glass-bg p-5 backdrop-blur-glass shadow-inner-glow transition-colors hover:border-primary/30',
        extra,
      )}
    >
      {children}
    </div>
  );
}

function StatIcon({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute right-3 top-3 opacity-[0.12]',
        className,
      )}
      aria-hidden
    >
      {children}
    </div>
  );
}

export function TransportadoraStatsCards({
  total,
  ativas,
  inativas,
  totalVeiculos,
}: TransportadoraStatsCardsProps) {
  const formatNumber = new Intl.NumberFormat('pt-BR');
  const pctAtivas = total > 0 ? Math.round((ativas / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-4">
      <StatCard>
        <StatIcon>
          <Building2 className="size-10 text-primary" />
        </StatIcon>
        <p className="text-caption font-bold uppercase tracking-widest text-muted-foreground">
          Total de transportadoras
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-headline-md font-bold text-primary">
            {formatNumber.format(total)}
          </span>
          <span className="text-caption text-muted-foreground">cadastradas</span>
        </div>
      </StatCard>

      <StatCard>
        <StatIcon>
          <Truck className="size-10 text-status-active" />
        </StatIcon>
        <p className="text-caption font-bold uppercase tracking-widest text-muted-foreground">
          Transportadoras ativas
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-headline-md font-bold text-foreground">
            {formatNumber.format(ativas)}
          </span>
          <span className="text-caption font-medium text-status-active">
            {pctAtivas}% operacional
          </span>
        </div>
      </StatCard>

      <StatCard extra="border-destructive/25 hover:border-destructive/40">
        <StatIcon>
          <XCircle className="size-10 text-destructive" />
        </StatIcon>
        <p className="text-caption font-bold uppercase tracking-widest text-destructive/90">
          Inativas
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-headline-md font-bold text-destructive">
            {formatNumber.format(inativas)}
          </span>
          <span className="text-caption text-muted-foreground">
            sem operação
          </span>
        </div>
      </StatCard>

      <StatCard extra="border-primary/20">
        <StatIcon>
          <TruckIcon className="size-10 text-secondary-foreground" />
        </StatIcon>
        <p className="text-caption font-bold uppercase tracking-widest text-muted-foreground">
          Frota total
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-headline-md font-bold text-secondary-foreground">
            {formatNumber.format(totalVeiculos)}
          </span>
          <span className="text-caption text-muted-foreground">veículos</span>
        </div>
      </StatCard>
    </div>
  );
}
