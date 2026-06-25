import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { AlertCircle, AlertTriangle, Bell, Info } from 'lucide-react';

import type { AlertaOperacional } from '@/features/indicadores/lib/torre-controle.schema';

type AlertasCompletosSheetProps = {
  open: boolean;
  alertas: AlertaOperacional[];
  onOpenChange: (open: boolean) => void;
};

const SEVERITY_CONFIG = {
  error: {
    card: 'border-destructive/30 bg-destructive/5',
    icon: 'bg-destructive/15 text-destructive',
    Icon: AlertCircle,
  },
  warning: {
    card: 'border-warning/30 bg-warning-container/40',
    icon: 'bg-warning/15 text-warning',
    Icon: AlertTriangle,
  },
  info: {
    card: 'border-secondary/25 bg-secondary/5',
    icon: 'bg-secondary/10 text-secondary',
    Icon: Info,
  },
} as const;

export function AlertasCompletosSheet({
  open,
  alertas,
  onOpenChange,
}: AlertasCompletosSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[85vh] flex-col rounded-t-2xl border-t-0 px-0"
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-outline-variant" aria-hidden />

        <SheetHeader className="border-b border-outline-variant/60 px-5 pb-4 text-left">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
            <Bell className="h-5 w-5 text-destructive" aria-hidden />
          </div>
          <SheetTitle className="text-headline-md">Centro de alertas</SheetTitle>
          <SheetDescription>
            {alertas.length} alerta{alertas.length === 1 ? '' : 's'} operacionais
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
          {alertas.length === 0 ? (
            <p className="py-8 text-center text-body-sm text-on-surface-variant">
              Nenhum alerta operacional no momento.
            </p>
          ) : (
            alertas.map((alerta) => {
              const config = SEVERITY_CONFIG[alerta.severity];
              const SeverityIcon = config.Icon;

              return (
                <article
                  key={alerta.id}
                  className={`flex gap-3 rounded-xl border p-3 ${config.card}`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.icon}`}
                  >
                    <SeverityIcon className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-on-surface">{alerta.title}</p>
                      <span className="shrink-0 text-[10px] font-medium text-on-surface-variant">
                        {alerta.timeAgo}
                      </span>
                    </div>
                    <p className="mt-1 text-label-sm text-on-surface-variant">
                      {alerta.description}
                    </p>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
