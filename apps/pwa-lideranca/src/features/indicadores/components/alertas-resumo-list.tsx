import { AlertCircle, AlertTriangle, Bell, Info } from 'lucide-react';

import { cn } from '@lilog/ui';

import { SectionHeader } from '@/features/indicadores/components/section-header';
import type { AlertaOperacional } from '@/features/indicadores/lib/torre-controle.schema';
import { hapticLight } from '@/lib/haptics';

const SEVERITY_CONFIG = {
  error: {
    border: 'border-destructive/30',
    bg: 'bg-destructive/5',
    icon: 'bg-destructive/15 text-destructive',
    time: 'text-destructive',
    Icon: AlertCircle,
  },
  warning: {
    border: 'border-warning/30',
    bg: 'bg-warning-container/40',
    icon: 'bg-warning/15 text-warning',
    time: 'text-warning',
    Icon: AlertTriangle,
  },
  info: {
    border: 'border-secondary/25',
    bg: 'bg-secondary/5',
    icon: 'bg-secondary/10 text-secondary',
    time: 'text-secondary',
    Icon: Info,
  },
} as const;

type AlertasResumoListProps = {
  alertas: AlertaOperacional[];
  onVerTodos: () => void;
  className?: string;
};

export function AlertasResumoList({
  alertas,
  onVerTodos,
  className,
}: AlertasResumoListProps) {
  const destaques = alertas.slice(0, 5);

  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border border-outline-variant/80 bg-surface shadow-sm',
        className,
      )}
    >
      <div className="border-b border-outline-variant/60 px-3 py-2">
        <SectionHeader
          icon={Bell}
          title="Alertas"
          badge={alertas.length > 0 ? alertas.length : undefined}
          tone={alertas.some((a) => a.severity === 'error') ? 'danger' : 'default'}
          compact
          action={
            alertas.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  hapticLight();
                  onVerTodos();
                }}
                className="rounded-full bg-secondary/10 px-3 py-1 text-label-sm font-semibold text-secondary touch-manipulation active:scale-95"
              >
                Ver todos
              </button>
            ) : undefined
          }
        />
      </div>

      {destaques.length === 0 ? (
        <div className="flex flex-col items-center px-3 py-5 text-center">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-surface-container">
            <Bell className="h-4 w-4 text-on-surface-variant" aria-hidden />
          </div>
          <p className="text-label-sm font-medium text-on-surface">Sem alertas</p>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">
            Nenhum alerta operacional no momento.
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5 p-2">
          {destaques.map((alerta) => {
            const config = SEVERITY_CONFIG[alerta.severity];
            const SeverityIcon = config.Icon;

            return (
              <li
                key={alerta.id}
                className={cn(
                  'flex gap-2 rounded-lg border p-2',
                  config.border,
                  config.bg,
                )}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                    config.icon,
                  )}
                >
                  <SeverityIcon className="h-3.5 w-3.5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-label-sm font-semibold text-on-surface">
                      {alerta.title}
                    </p>
                    <span
                      className={cn(
                        'shrink-0 text-[9px] font-medium tabular-nums',
                        config.time,
                      )}
                    >
                      {alerta.timeAgo}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-on-surface-variant">
                    {alerta.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
