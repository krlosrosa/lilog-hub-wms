'use client';

import { AlertTriangle, Clock, Coffee } from 'lucide-react';

import { cn } from '@lilog/ui';

import type { Operator } from '@/features/gestao-recursos/types/gestao-recursos.schema';
import { formatIntervaloTrabalho } from '@/features/regras-pausas/lib/calcular-alerta-pausa';
import { TIPO_PAUSA_REGRA_LABELS } from '@/features/regras-pausas/types/tipo-pausa-regra-tabs';

type OperadorProximaPausaResumoProps = {
  operator: Operator | null | undefined;
  variant?: 'default' | 'emphasis';
  className?: string;
};

export function OperadorProximaPausaResumo({
  operator,
  variant = 'default',
  className,
}: OperadorProximaPausaResumoProps) {
  if (!operator) {
    return null;
  }

  if (operator.emPausa) {
    return (
      <div
        className={cn(
          'flex items-start gap-2 rounded-lg border border-outline-variant bg-muted/30 px-3 py-2.5',
          className,
        )}
      >
        <Coffee className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0">
          <p className="text-caption font-medium text-foreground">Em pausa</p>
          <p className="text-[11px] text-muted-foreground">
            A contagem de trabalho contínuo retoma ao encerrar a pausa.
          </p>
        </div>
      </div>
    );
  }

  const hasPausaInfo =
    operator.intervaloPausaReferenciaMinutos != null &&
    operator.pausaTipoSugerido != null;

  if (!hasPausaInfo) {
    return null;
  }

  const tipoLabel = TIPO_PAUSA_REGRA_LABELS[operator.pausaTipoSugerido!];
  const atrasoMinutos = operator.pausaAtrasoMinutos ?? 0;
  const atrasada = Boolean(operator.precisaPausa && atrasoMinutos > 0);
  const devidaAgora = Boolean(operator.precisaPausa && atrasoMinutos === 0);
  const destaque = atrasada || devidaAgora || variant === 'emphasis';

  if (atrasada) {

    return (
      <div
        role="alert"
        className={cn(
          'rounded-lg border-2 border-destructive/60 bg-destructive/10 px-3 py-3 shadow-sm',
          destaque && 'ring-2 ring-destructive/25',
          className,
        )}
      >
        <div className="flex items-start gap-2.5">
          <AlertTriangle
            className="mt-0.5 size-5 shrink-0 text-destructive"
            aria-hidden
          />
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <p className="text-label-md font-semibold text-destructive">
                Pausa atrasada
              </p>
              <p className="text-caption text-destructive/90">
                {tipoLabel} devida há{' '}
                <strong>{formatIntervaloTrabalho(atrasoMinutos)}</strong>
                {operator.tempoTrabalhoContinuoMinutos != null ? (
                  <>
                    {' '}
                    · trabalho contínuo:{' '}
                    {formatIntervaloTrabalho(operator.tempoTrabalhoContinuoMinutos)}
                  </>
                ) : null}
              </p>
            </div>
            {operator.pausaDevidaProgress != null ? (
              <div className="space-y-1">
                <div className="h-2 overflow-hidden rounded-full bg-destructive/20">
                  <div
                    className="h-full rounded-full bg-destructive transition-all"
                    style={{
                      width: `${Math.min(100, operator.pausaDevidaProgress)}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-destructive">
                  Intervalo de {formatIntervaloTrabalho(operator.intervaloPausaReferenciaMinutos!)} ultrapassado
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (devidaAgora) {
    return (
      <div
        role="alert"
        className={cn(
          'rounded-lg border-2 border-amber-500/60 bg-amber-500/15 px-3 py-3 shadow-sm ring-2 ring-amber-500/20',
          className,
        )}
      >
        <div className="flex items-start gap-2.5">
          <Coffee
            className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-300"
            aria-hidden
          />
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <p className="text-label-md font-semibold text-amber-800 dark:text-amber-200">
                Pausa devida agora
              </p>
              <p className="text-caption text-amber-900/90 dark:text-amber-100/90">
                {tipoLabel} atingiu o intervalo de{' '}
                {formatIntervaloTrabalho(operator.intervaloPausaReferenciaMinutos!)}
                {operator.tempoTrabalhoContinuoMinutos != null ? (
                  <>
                    {' '}
                    · trabalho contínuo:{' '}
                    {formatIntervaloTrabalho(operator.tempoTrabalhoContinuoMinutos)}
                  </>
                ) : null}
              </p>
            </div>
            {operator.pausaDevidaProgress != null ? (
              <div className="h-2 overflow-hidden rounded-full bg-amber-500/25">
                <div className="h-full w-full rounded-full bg-amber-600 dark:bg-amber-400" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const restante = operator.pausaTempoRestanteMinutos ?? 0;

  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2.5',
        destaque
          ? 'border-amber-500/40 bg-amber-500/10'
          : 'border-outline-variant bg-muted/20',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <Clock
          className={cn(
            'mt-0.5 size-4 shrink-0',
            destaque ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-caption font-medium text-foreground">
            Próxima pausa ({tipoLabel})
          </p>
          <p className="text-[11px] text-muted-foreground">
            Em aproximadamente{' '}
            <strong className="text-foreground">
              {formatIntervaloTrabalho(restante)}
            </strong>
            {operator.tempoTrabalhoContinuoMinutos != null ? (
              <>
                {' '}
                · {formatIntervaloTrabalho(operator.tempoTrabalhoContinuoMinutos)} de{' '}
                {formatIntervaloTrabalho(operator.intervaloPausaReferenciaMinutos!)}{' '}
                trabalhados
              </>
            ) : null}
          </p>
          {operator.pausaDevidaProgress != null ? (
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-high">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${operator.pausaDevidaProgress}%` }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
