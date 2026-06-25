'use client';

import { Award, TrendingUp } from 'lucide-react';

import { cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import type { ProductivityKpis } from '@/features/op-wms/types/op-wms.schema';

type ProductivityStatsProps = {
  kpis: ProductivityKpis;
  className?: string;
};

export function ProductivityStats({ kpis, className }: ProductivityStatsProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-gutter sm:grid-cols-3', className)}>
      <div className={cn(glassPanelClassName, 'relative overflow-hidden p-6')}>
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          aria-hidden
          style={{
            background:
              'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.08), transparent)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite linear',
          }}
        />
        <p className="mb-2 text-label-sm text-muted-foreground">Tarefas Turno</p>
        <h2 className="text-display-lg font-bold leading-none text-primary">
          {kpis.tasksCompleted}
          <span className="ml-2 text-headline-lg-mobile text-muted-foreground">
            / {kpis.tasksGoal}
          </span>
        </h2>
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-surface-highest">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${kpis.tasksProgressPercent}%` }}
          />
        </div>
        <p className="mt-2 flex items-center gap-1 text-caption text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5 text-accent" aria-hidden />
          +{kpis.tasksDeltaPercent}% vs. média ontem
        </p>
      </div>

      <div className={cn(glassPanelClassName, 'p-6')}>
        <p className="mb-2 text-label-sm text-muted-foreground">Tempo Médio (U/m)</p>
        <h2 className="text-display-lg font-bold leading-none text-primary">
          {kpis.averageTimePerUnit}
        </h2>
        <div className="mt-4 flex h-8 items-end gap-1">
          <div className="h-2 w-full rounded bg-outline-variant" />
          <div className="h-4 w-full rounded bg-outline-variant" />
          <div className="h-8 w-full rounded bg-primary" />
          <div className="h-6 w-full rounded bg-primary" />
          <div className="h-7 w-full rounded bg-primary" />
        </div>
        <p className="mt-2 text-caption text-muted-foreground">Meta: &lt; 0:45</p>
      </div>

      <div className={cn(glassPanelClassName, 'flex flex-col justify-between p-6')}>
        <div>
          <p className="mb-1 text-label-sm text-muted-foreground">Qualidade Picking</p>
          <h2 className="text-headline-lg font-bold leading-none text-accent">
            {kpis.qualityPercent}%
          </h2>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" aria-hidden />
          <span className="text-label-sm font-bold text-foreground">
            {kpis.qualityLevel}
          </span>
        </div>
      </div>
    </div>
  );
}
