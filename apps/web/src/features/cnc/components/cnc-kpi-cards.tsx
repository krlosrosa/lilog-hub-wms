import { cn } from '@lilog/ui';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  XCircle,
} from 'lucide-react';

import type { CncKpi } from '@/features/cnc/types/cnc.schema';

type CncKpiCardsProps = {
  kpi: CncKpi;
  isLoading?: boolean;
};

export function CncKpiCards({ kpi, isLoading = false }: CncKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      <article className="relative overflow-hidden rounded-xl border border-outline-variant/50 bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
        <div className="mb-4 flex items-start justify-between">
          <div className="rounded-lg bg-primary/20 p-2 text-primary">
            <ShieldAlert className="size-5" aria-hidden />
          </div>
        </div>
        <p className="text-label-md text-muted-foreground">Total de CNCs</p>
        <h3 className="mt-1 text-headline-md font-bold text-foreground">
          {isLoading ? '—' : kpi.total}
        </h3>
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-primary/40 to-transparent" />
      </article>

      <article className="relative overflow-hidden rounded-xl border border-outline-variant/50 bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
        <div className="mb-4 flex items-start justify-between">
          <div className="rounded-lg bg-amber-500/20 p-2 text-amber-500">
            <Clock className="size-5" aria-hidden />
          </div>
        </div>
        <p className="text-label-md text-muted-foreground">Pendentes</p>
        <h3 className="mt-1 text-headline-md font-bold text-foreground">
          {isLoading ? '—' : kpi.pendentes}
        </h3>
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-surface-highest">
          <div
            className="h-full bg-amber-500"
            style={{
              width:
                kpi.total > 0
                  ? `${Math.min(100, (kpi.pendentes / kpi.total) * 100)}%`
                  : '0%',
            }}
          />
        </div>
      </article>

      <article className="relative overflow-hidden rounded-xl border border-outline-variant/50 bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
        <div className="mb-4 flex items-start justify-between">
          <div className="rounded-lg bg-secondary-container/20 p-2 text-secondary">
            <AlertTriangle className="size-5" aria-hidden />
          </div>
        </div>
        <p className="text-label-md text-muted-foreground">Em Análise</p>
        <h3 className="mt-1 text-headline-md font-bold text-foreground">
          {isLoading ? '—' : kpi.emAnalise}
        </h3>
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-surface-highest">
          <div
            className={cn('h-full bg-secondary')}
            style={{
              width:
                kpi.total > 0
                  ? `${Math.min(100, (kpi.emAnalise / kpi.total) * 100)}%`
                  : '0%',
            }}
          />
        </div>
      </article>

      <article className="relative overflow-hidden rounded-xl border border-outline-variant/50 bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
        <div className="mb-4 flex items-start justify-between">
          <div className="rounded-lg bg-tertiary-container/20 p-2 text-tertiary">
            <CheckCircle2 className="size-5" aria-hidden />
          </div>
          {!isLoading && kpi.canceladas > 0 ? (
            <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
              <XCircle className="size-3" aria-hidden />
              {kpi.canceladas} cancelada{kpi.canceladas !== 1 ? 's' : ''}
            </span>
          ) : null}
        </div>
        <p className="text-label-md text-muted-foreground">Encerradas</p>
        <h3 className="mt-1 text-headline-md font-bold text-foreground">
          {isLoading ? '—' : kpi.encerradas}
        </h3>
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-surface-highest">
          <div
            className="h-full bg-tertiary"
            style={{
              width:
                kpi.total > 0
                  ? `${Math.min(100, (kpi.encerradas / kpi.total) * 100)}%`
                  : '0%',
            }}
          />
        </div>
      </article>
    </div>
  );
}
