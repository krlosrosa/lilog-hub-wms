import {
  AlertCircle,
  AlertTriangle,
  Clock,
  Package,
} from 'lucide-react';

import { cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import type { PickingKpi } from '@/features/op-wms/types/op-wms.schema';

const variantStyles = {
  critical: {
    accent: 'border-l-destructive/50',
    icon: 'text-destructive/70',
    value: 'text-foreground',
    badge: 'bg-destructive/10 text-destructive',
  },
  warning: {
    accent: 'border-l-amber-500/40',
    icon: 'text-amber-500/70',
    value: 'text-foreground',
    badge: 'bg-amber-500/10 text-muted-foreground',
  },
  active: {
    accent: 'border-l-primary/40',
    icon: 'text-primary/70',
    value: 'text-foreground',
    badge: 'bg-primary/10 text-primary',
  },
  neutral: {
    accent: 'border-l-outline-variant',
    icon: 'text-muted-foreground/60',
    value: 'text-foreground',
    badge: 'bg-muted text-muted-foreground',
  },
} as const;

const iconMap = {
  error: AlertCircle,
  warning: AlertTriangle,
  pending: Clock,
  inventory: Package,
} as const;

type PickingKpiCardProps = {
  kpi: PickingKpi;
};

export function PickingKpiCard({ kpi }: PickingKpiCardProps) {
  const styles = variantStyles[kpi.variant];
  const Icon = iconMap[kpi.icon];

  return (
    <article
      className={cn(
        glassPanelClassName,
        'border-l-2 p-4 transition-colors',
        styles.accent,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-caption text-muted-foreground">{kpi.label}</p>
        <Icon className={cn('h-4 w-4 shrink-0', styles.icon)} aria-hidden />
      </div>
      <h2 className={cn('mt-2 text-headline-lg-mobile font-semibold md:text-headline-md', styles.value)}>
        {kpi.value}
      </h2>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', styles.badge)}>
          {kpi.badge}
        </span>
        <span className="text-[10px] text-muted-foreground">{kpi.subtext}</span>
      </div>
    </article>
  );
}
