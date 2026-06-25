'use client';

import { AlertTriangle, Clock, Coffee } from 'lucide-react';

import { cn } from '@lilog/ui';

import { formatIntervaloTrabalho } from '@/features/gestao-recursos/lib/format-intervalo-trabalho';
import type { Operator } from '@/features/gestao-recursos/types/gestao-recursos.schema';
import {
  PAUSA_RETORNO_ALERTA_TITULO,
  TIPO_PAUSA_LABELS,
} from '@/features/gestao-recursos/types/pausa-labels';

type OperadorPausaResumoCompactProps = {
  operator: Operator;
  className?: string;
};

export function OperadorPausaResumoCompact({
  operator,
  className,
}: OperadorPausaResumoCompactProps) {
  if (operator.emPausa) {
    const retornoAtrasado = Boolean(operator.isPauseOverPlanned);
    const atrasoRetornoMinutos = operator.pauseAtrasoRetornoMinutos ?? 0;

    if (retornoAtrasado) {
      return (
        <div
          role="alert"
          className={cn(
            'rounded-lg border-2 border-error/50 bg-error-container/30 px-2.5 py-2',
            className,
          )}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-error"
              aria-hidden
            />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-label-sm font-semibold text-error">
                {PAUSA_RETORNO_ALERTA_TITULO}
              </p>
              <p className="text-[11px] text-on-error-container">
                {operator.pauseDuration?.replace(' EM PAUSA', '') ?? '—'}
                {atrasoRetornoMinutos > 0
                  ? ` · ${formatIntervaloTrabalho(atrasoRetornoMinutos)} além do previsto`
                  : ''}
                {operator.pausePrevisaoRetorno &&
                operator.pausePrevisaoRetorno !== '—'
                  ? ` · retorno era às ${operator.pausePrevisaoRetorno}`
                  : ''}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg bg-surface-container px-2.5 py-2',
          className,
        )}
      >
        <Coffee className="size-4 shrink-0 text-on-surface-variant" aria-hidden />
        <div className="min-w-0">
          <p className="text-label-sm font-medium text-on-surface">Em pausa</p>
          <p className="text-[11px] text-on-surface-variant">
            {operator.pauseDuration?.replace(' EM PAUSA', '') ?? '—'}
            {operator.pausePrevisaoRetorno && operator.pausePrevisaoRetorno !== '—'
              ? ` · retorno ${operator.pausePrevisaoRetorno}`
              : ''}
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

  const tipoLabel = TIPO_PAUSA_LABELS[operator.pausaTipoSugerido!];
  const atrasoMinutos = operator.pausaAtrasoMinutos ?? 0;
  const atrasada = Boolean(operator.precisaPausa && atrasoMinutos > 0);
  const devidaAgora = Boolean(operator.precisaPausa && atrasoMinutos === 0);

  if (atrasada) {
    return (
      <div
        role="alert"
        className={cn(
          'rounded-lg border-2 border-error/50 bg-error-container/30 px-2.5 py-2',
          className,
        )}
      >
        <div className="flex items-start gap-2">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-error"
            aria-hidden
          />
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-label-sm font-semibold text-error">
              Pausa atrasada · {tipoLabel}
            </p>
            <p className="text-[11px] text-on-error-container">
              Devida há {formatIntervaloTrabalho(atrasoMinutos)}
              {operator.tempoTrabalhoContinuoMinutos != null
                ? ` · ${formatIntervaloTrabalho(operator.tempoTrabalhoContinuoMinutos)} contínuo`
                : ''}
            </p>
            {operator.pausaDevidaProgress != null ? (
              <div className="h-1.5 overflow-hidden rounded-full bg-error/20">
                <div className="h-full w-full rounded-full bg-error" />
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
          'rounded-lg border border-warning/50 bg-warning-container/40 px-2.5 py-2',
          className,
        )}
      >
        <div className="flex items-start gap-2">
          <Coffee className="mt-0.5 size-4 shrink-0 text-on-warning-container" aria-hidden />
          <div className="min-w-0">
            <p className="text-label-sm font-semibold text-on-warning-container">
              Pausa devida agora · {tipoLabel}
            </p>
            <p className="text-[11px] text-on-warning-container/80">
              Intervalo de{' '}
              {formatIntervaloTrabalho(operator.intervaloPausaReferenciaMinutos!)}{' '}
              atingido
            </p>
          </div>
        </div>
      </div>
    );
  }

  const restante = operator.pausaTempoRestanteMinutos ?? 0;

  return (
    <div
      className={cn(
        'rounded-lg border border-outline-variant/60 bg-surface-container/60 px-2.5 py-2',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <Clock className="mt-0.5 size-4 shrink-0 text-on-surface-variant" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-label-sm font-medium text-on-surface">
            Próxima pausa · {tipoLabel}
          </p>
          <p className="text-[11px] text-on-surface-variant">
            Em ~{formatIntervaloTrabalho(restante)}
            {operator.tempoTrabalhoContinuoMinutos != null
              ? ` · ${formatIntervaloTrabalho(operator.tempoTrabalhoContinuoMinutos)}/${formatIntervaloTrabalho(operator.intervaloPausaReferenciaMinutos!)}`
              : ''}
          </p>
          {operator.pausaDevidaProgress != null ? (
            <div className="h-1 overflow-hidden rounded-full bg-outline-variant/30">
              <div
                className="h-full rounded-full bg-warning transition-all"
                style={{ width: `${operator.pausaDevidaProgress}%` }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
