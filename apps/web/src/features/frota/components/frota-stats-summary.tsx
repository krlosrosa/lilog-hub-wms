'use client';

import { cn } from '@lilog/ui';
import { Ban, CalendarClock, Truck, Wrench } from 'lucide-react';

import type { FrotaStats } from '@/features/frota/types/frota.schema';

type FrotaStatsSummaryProps = {
  stats: FrotaStats;
  className?: string;
};

function StatCard({
  label,
  value,
  subtext,
  icon,
  variant = 'default',
}: {
  label: string;
  value: number;
  subtext: string;
  icon: React.ReactNode;
  variant?: 'default' | 'destructive' | 'secondary' | 'accent';
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-6',
        variant === 'destructive' && 'border-destructive/40 bg-card',
        variant === 'accent' && 'border-primary/30 bg-card',
        variant === 'secondary' && 'border-outline-variant bg-card',
        variant === 'default' && 'border-outline-variant bg-card',
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            'text-label-sm font-medium uppercase tracking-widest',
            variant === 'destructive' && 'text-destructive',
            variant === 'accent' && 'text-primary',
            variant === 'secondary' && 'text-secondary-foreground',
            variant === 'default' && 'text-muted-foreground',
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            'opacity-20',
            variant === 'destructive' && 'text-destructive',
            variant === 'default' && 'text-muted-foreground',
          )}
        >
          {icon}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            'text-display-lg font-bold tracking-tight',
            variant === 'destructive' && 'text-destructive',
            variant === 'accent' && 'text-primary',
            variant === 'secondary' && 'text-secondary-foreground',
            variant === 'default' && 'text-primary',
          )}
        >
          {value}
        </span>
        <span className="text-label-sm text-muted-foreground">{subtext}</span>
      </div>
    </div>
  );
}

export function FrotaStatsSummary({ stats, className }: FrotaStatsSummaryProps) {
  return (
    <section
      className={cn(
        'grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      <StatCard
        label="Frota ativa"
        value={stats.frotaAtiva}
        subtext="Veículos"
        icon={<Truck className="h-8 w-8" aria-hidden />}
      />
      <StatCard
        label="Veículos bloqueados"
        value={stats.veiculosBloqueados}
        subtext="Problema crítico"
        icon={<Ban className="h-8 w-8" aria-hidden />}
        variant="destructive"
      />
      <StatCard
        label="Manutenções atrasadas"
        value={stats.manutencoesAtrasadas}
        subtext="Tarefas vencidas"
        icon={<Wrench className="h-8 w-8" aria-hidden />}
        variant="secondary"
      />
      <StatCard
        label="Próxima agenda"
        value={stats.proximaAgenda}
        subtext="Eventos (7d)"
        icon={<CalendarClock className="h-8 w-8" aria-hidden />}
        variant="accent"
      />
    </section>
  );
}
