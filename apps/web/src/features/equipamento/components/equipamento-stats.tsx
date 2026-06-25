'use client';

import type { ReactNode } from 'react';

import { cn } from '@lilog/ui';
import { AlertTriangle, DollarSign, Forklift, Wrench } from 'lucide-react';

import type { EquipamentoStats } from '@/features/equipamento/types/equipamento.schema';

type EquipamentoStatsProps = {
  stats: EquipamentoStats;
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

export function EquipamentoStatsCards({ stats }: EquipamentoStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-4">
      <StatCard>
        <StatIcon>
          <Forklift className="size-10 text-primary" />
        </StatIcon>
        <p className="text-caption font-bold uppercase tracking-widest text-muted-foreground">
          Disponibilidade
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-headline-md font-bold text-primary">
            {stats.disponibilidadePercent}%
          </span>
          <span className="text-caption text-status-active">operacional</span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${stats.disponibilidadePercent}%` }}
          />
        </div>
      </StatCard>

      <StatCard extra="border-primary/20">
        <StatIcon>
          <Wrench className="size-10 text-secondary-foreground" />
        </StatIcon>
        <p className="text-caption font-bold uppercase tracking-widest text-muted-foreground">
          Em manutenção
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-headline-md font-bold text-secondary-foreground">
            {String(stats.emManutencao).padStart(2, '0')}
          </span>
          <span className="text-caption text-muted-foreground">ativos</span>
        </div>
      </StatCard>

      <StatCard extra="border-destructive/25 hover:border-destructive/40">
        <StatIcon>
          <AlertTriangle className="size-10 text-destructive" />
        </StatIcon>
        <p className="text-caption font-bold uppercase tracking-widest text-destructive/90">
          Bloqueios críticos
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-headline-md font-bold text-destructive">
            {String(stats.bloqueiosCriticos).padStart(2, '0')}
          </span>
          <span className="text-caption text-muted-foreground">
            requer atenção
          </span>
        </div>
      </StatCard>

      <StatCard>
        <StatIcon>
          <DollarSign className="size-10 text-tertiary" />
        </StatIcon>
        <p className="text-caption font-bold uppercase tracking-widest text-muted-foreground">
          Custos do mês
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-headline-md font-bold text-foreground">
            {stats.custosMes}
          </span>
        </div>
      </StatCard>
    </div>
  );
}
