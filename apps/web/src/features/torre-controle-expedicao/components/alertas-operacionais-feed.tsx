'use client';

import { AlertTriangle } from 'lucide-react';

import { cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import type {
  AlertSeverity,
  AlertaOperacional,
} from '@/features/torre-controle-expedicao/types/torre-controle.schema';

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
    border: 'border-l-tertiary',
    bg: 'bg-tertiary-container/30',
    time: 'text-tertiary',
  },
  info: {
    border: 'border-l-primary',
    bg: 'bg-primary/5',
    time: 'text-primary',
  },
};

export type AlertasOperacionaisFeedProps = {
  alertas: AlertaOperacional[];
  onAlertClick: (alerta: AlertaOperacional) => void;
  className?: string;
  variant?: 'panel' | 'sheet';
};

export function AlertasOperacionaisFeed({
  alertas,
  onAlertClick,
  className,
  variant = 'panel',
}: AlertasOperacionaisFeedProps) {
  const isSheet = variant === 'sheet';

  return (
    <section
      id={isSheet ? undefined : 'centro-alertas'}
      className={cn(
        isSheet
          ? 'flex h-full flex-col'
          : cn(
              glassPanelClassName,
              'flex h-full min-h-[320px] flex-col rounded-xl p-4 md:min-h-[420px] md:p-6',
            ),
        className,
      )}
    >
      {!isSheet ? (
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="size-5 text-destructive" aria-hidden />
          <h2 className="text-title-md font-semibold text-foreground">
            Centro de Alertas
          </h2>
        </div>
      ) : null}

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {alertas.length === 0 ? (
          <p className="text-body-md text-muted-foreground">
            Nenhum alerta operacional no momento.
          </p>
        ) : (
          alertas.map((alerta) => {
            const styles = SEVERITY_STYLES[alerta.severity];

            return (
              <button
                key={alerta.id}
                type="button"
                onClick={() => onAlertClick(alerta)}
                className={cn(
                  'w-full rounded-r-lg border-l-4 p-3 text-left transition-colors hover:brightness-95',
                  styles.border,
                  styles.bg,
                )}
              >
                <p className="text-label-sm font-bold text-foreground">
                  {alerta.title}
                </p>
                <p className="mt-0.5 text-caption text-muted-foreground">
                  {alerta.description}
                </p>
                <p
                  className={cn(
                    'mt-1 text-[10px] font-medium uppercase',
                    styles.time,
                  )}
                >
                  {alerta.timeAgo}
                </p>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
