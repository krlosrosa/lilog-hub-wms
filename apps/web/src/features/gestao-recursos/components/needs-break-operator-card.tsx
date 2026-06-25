'use client';

import { Coffee } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { formatDurationMinutes } from '@/features/pausas/lib/pausas-mappers';
import { TIPO_PAUSA_REGRA_LABELS } from '@/features/regras-pausas/types/tipo-pausa-regra-tabs';
import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import type { Operator } from '@/features/gestao-recursos/types/gestao-recursos.schema';

type NeedsBreakOperatorCardProps = {
  operators: Operator[];
  isLoading?: boolean;
  onIniciarPausaTermica: (operatorId: string) => void;
};

export function NeedsBreakOperatorCard({
  operators,
  isLoading,
  onIniciarPausaTermica,
}: NeedsBreakOperatorCardProps) {
  return (
    <section className={cn(glassPanelClassName, 'flex flex-col overflow-hidden')}>
      <div className="flex items-center gap-2 border-b border-outline-variant/60 px-3 py-2">
        <Coffee className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <h2 className="text-caption font-medium text-foreground">Pausa devida</h2>
        <span className="ml-auto rounded-full bg-amber-500/10 px-1.5 py-px text-[10px] font-medium tabular-nums text-amber-700 dark:text-amber-300">
          {operators.length}
        </span>
      </div>

      <div className="divide-y divide-outline-variant/40">
        {operators.length === 0 ? (
          <p className="px-3 py-4 text-center text-caption text-muted-foreground">
            Nenhum operador precisa de pausa agora.
          </p>
        ) : (
          operators.map((operator) => {
            const tipoLabel = operator.pausaTipoSugerido
              ? TIPO_PAUSA_REGRA_LABELS[operator.pausaTipoSugerido]
              : 'Pausa';
            const trabalhoLabel = operator.tempoTrabalhoContinuoMinutos
              ? formatDurationMinutes(operator.tempoTrabalhoContinuoMinutos).toUpperCase()
              : '—';

            return (
              <article
                key={operator.id}
                className="group px-3 py-2 transition-colors hover:bg-surface-high/30"
              >
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-caption font-medium text-foreground">
                      {operator.name}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {tipoLabel}
                      {operator.pausaAtrasoMinutos
                        ? ` · +${operator.pausaAtrasoMinutos} min`
                        : ''}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-md bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-amber-700 dark:text-amber-300">
                    {trabalhoLabel}
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 gap-1 px-2 text-[10px] text-amber-800 opacity-90 transition-all hover:bg-amber-500/15 hover:text-amber-900 group-hover:opacity-100 dark:text-amber-300 dark:hover:text-amber-200"
                    disabled={isLoading}
                    onClick={() => onIniciarPausaTermica(operator.id)}
                    aria-label={`Registrar pausa térmica para ${operator.name}`}
                  >
                    <Coffee className="h-3.5 w-3.5" aria-hidden />
                    <span className="hidden sm:inline">Pausa térmica</span>
                  </Button>
                </div>

                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-surface-high">
                    <div
                      className="h-full rounded-full bg-amber-500/70 transition-all"
                      style={{ width: `${operator.pausaDevidaProgress ?? 0}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-[10px] tabular-nums text-muted-foreground">
                    {operator.pausaDevidaProgress ?? 0}%
                  </span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
