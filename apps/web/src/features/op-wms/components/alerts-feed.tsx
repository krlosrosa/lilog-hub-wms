'use client';

import { AlertTriangle } from 'lucide-react';

import { cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import type { AlertSeverity, WmsAlert } from '@/features/op-wms/types/op-wms.schema';

const SEVERITY_STYLES: Record<
  AlertSeverity,
  { border: string; bg: string; time: string }
> = {
  error: {
    border: 'border-l-destructive',
    bg: 'bg-destructive/5',
    time: 'text-destructive',
  },
  warning: {
    border: 'border-l-secondary',
    bg: 'bg-secondary/10',
    time: 'text-secondary',
  },
  info: {
    border: 'border-l-primary',
    bg: 'bg-primary/5',
    time: 'text-primary',
  },
};

type AlertsFeedProps = {
  alerts: WmsAlert[];
  className?: string;
};

export function AlertsFeed({ alerts, className }: AlertsFeedProps) {
  return (
    <div
      className={cn(
        glassPanelClassName,
        'flex h-[300px] flex-col rounded-2xl p-6',
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
        <h3 className="text-title-md font-semibold text-foreground">Alertas Críticos</h3>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto pr-2">
        {alerts.length === 0 ? (
          <p className="text-body-md text-muted-foreground">Nenhum alerta no momento.</p>
        ) : (
          alerts.map((alert) => {
            const styles = SEVERITY_STYLES[alert.severity];
            return (
              <div
                key={alert.id}
                className={cn(
                  'rounded-r-lg border-l-4 p-3',
                  styles.border,
                  styles.bg,
                )}
              >
                <p className="text-label-sm font-bold text-foreground">{alert.title}</p>
                <p className="text-caption text-muted-foreground">{alert.description}</p>
                <p className={cn('mt-1 text-[10px] font-medium uppercase', styles.time)}>
                  {alert.timeAgo}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
