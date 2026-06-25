'use client';

import { Coffee, LogOut } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { PausaStatusBadge } from '@/features/pausas/components/pausa-status-badge';
import { PausaTipoBadge } from '@/features/pausas/components/pausa-tipo-badge';
import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import type { Operator } from '@/features/gestao-recursos/types/gestao-recursos.schema';

type PausedOperatorCardProps = {
  operators: Operator[];
  isLoading?: boolean;
  onEncerrarPausa: (operatorId: string) => void;
};

export function PausedOperatorCard({
  operators,
  isLoading,
  onEncerrarPausa,
}: PausedOperatorCardProps) {
  return (
    <section className={cn(glassPanelClassName, 'flex flex-col overflow-hidden')}>
      <div className="flex items-center gap-2 border-b border-outline-variant/60 px-3 py-2">
        <Coffee className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <h2 className="text-caption font-medium text-foreground">Em pausa</h2>
        <span className="ml-auto rounded-full bg-muted px-1.5 py-px text-[10px] font-medium tabular-nums text-muted-foreground">
          {operators.length}
        </span>
      </div>

      <div className="divide-y divide-outline-variant/40">
        {operators.length === 0 ? (
          <p className="px-3 py-4 text-center text-caption text-muted-foreground">
            Nenhum operador em pausa.
          </p>
        ) : (
          operators.map((operator) => (
            <article
              key={operator.id}
              className={cn(
                'group px-3 py-2 transition-colors hover:bg-surface-high/30',
                operator.isPauseOverPlanned &&
                  'bg-destructive/5 ring-1 ring-inset ring-destructive/20',
              )}
            >
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-caption font-medium text-foreground">
                      {operator.name}
                    </p>
                    {operator.pauseTipo ? (
                      <PausaTipoBadge tipo={operator.pauseTipo} compact />
                    ) : null}
                  </div>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {operator.sector}
                  </p>
                </div>

                <span className="shrink-0 rounded-md bg-surface-high px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                  {operator.pauseDuration?.replace(' EM PAUSA', '')}
                </span>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 gap-1 px-2 text-[10px] text-muted-foreground opacity-70 transition-all hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
                  disabled={isLoading}
                  onClick={() => onEncerrarPausa(operator.id)}
                  aria-label={`Encerrar pausa de ${operator.name}`}
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden />
                  <span className="hidden sm:inline">Encerrar</span>
                </Button>
              </div>

              {operator.pausePrevisaoRetorno &&
              operator.pausePrevisaoRetorno !== '—' ? (
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]">
                  <span className="text-muted-foreground">Retorno previsto</span>
                  <span
                    className={cn(
                      'font-mono tabular-nums',
                      operator.isPauseOverPlanned
                        ? 'font-semibold text-destructive'
                        : 'text-foreground',
                    )}
                  >
                    {operator.pausePrevisaoRetorno}
                  </span>
                </div>
              ) : null}

              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-surface-high">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      operator.isPauseOverPlanned
                        ? 'bg-destructive'
                        : 'bg-outline/70',
                    )}
                    style={{ width: `${operator.pauseThreshold ?? 0}%` }}
                  />
                </div>
                {operator.pauseStatus ? (
                  <PausaStatusBadge
                    kind="monitor"
                    status={operator.pauseStatus}
                    tempo={operator.pauseTempoRestante}
                    compact
                  />
                ) : (
                  <span className="w-6 text-right text-[10px] tabular-nums text-muted-foreground">
                    {operator.pauseThreshold}%
                  </span>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
