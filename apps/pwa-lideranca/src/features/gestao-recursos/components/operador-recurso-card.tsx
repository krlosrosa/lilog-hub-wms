'use client';

import { cn } from '@lilog/ui';
import { AlertTriangle, ChevronDown, Coffee } from 'lucide-react';
import { useState } from 'react';

import { hapticLight } from '@/lib/haptics';

import { OperadorPausaResumoCompact } from '@/features/gestao-recursos/components/operador-pausa-resumo-compact';
import type { Operator } from '@/features/gestao-recursos/types/gestao-recursos.schema';
import { PAUSA_RETORNO_BADGE_LABEL } from '@/features/gestao-recursos/types/pausa-labels';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

function StatusBadge({ operator }: { operator: Operator }) {
  if (operator.emPausa) {
    const retornoAtrasado = Boolean(operator.isPauseOverPlanned);

    return (
      <span
        className={cn(
          'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
          retornoAtrasado
            ? 'bg-error-container text-error ring-1 ring-error/30'
            : 'bg-surface-container text-on-surface-variant',
        )}
      >
        {retornoAtrasado ? (
          <AlertTriangle className="size-2.5" aria-hidden />
        ) : (
          <Coffee className="size-2.5" aria-hidden />
        )}
        {retornoAtrasado ? PAUSA_RETORNO_BADGE_LABEL : 'Pausa'}
      </span>
    );
  }

  if (operator.precisaPausa) {
    const atrasada = (operator.pausaAtrasoMinutos ?? 0) > 0;
    return (
      <span
        className={cn(
          'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
          atrasada
            ? 'bg-error-container text-error'
            : 'bg-warning-container text-on-warning-container',
        )}
      >
        <Coffee className="size-2.5" aria-hidden />
        {atrasada ? 'Pausa atrasada' : 'Pausa devida'}
      </span>
    );
  }

  if (operator.status === 'atuando') {
    return (
      <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-semibold uppercase text-on-secondary-container">
        Atuando
      </span>
    );
  }

  if (operator.status === 'ocioso') {
    return (
      <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-semibold uppercase text-on-surface-variant">
        Ocioso
      </span>
    );
  }

  return (
    <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-semibold uppercase text-on-surface-variant">
      Pausa
    </span>
  );
}

type OperadorRecursoCardProps = {
  operator: Operator;
};

export function OperadorRecursoCard({ operator }: OperadorRecursoCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasTasks = Boolean(operator.tasks?.length);
  const isUrgent =
    (operator.precisaPausa &&
      !operator.emPausa &&
      (operator.pausaAtrasoMinutos ?? 0) > 0) ||
    Boolean(operator.emPausa && operator.isPauseOverPlanned);

  return (
    <article
      className={cn(
        'overflow-hidden rounded-lg border bg-surface transition-transform touch-manipulation',
        isUrgent
          ? 'border-error/40 shadow-sm ring-1 ring-error/20'
          : operator.precisaPausa && !operator.emPausa
            ? 'border-warning/30'
            : 'border-outline-variant',
      )}
    >
      <button
        type="button"
        className="w-full px-3 py-3 text-left active:bg-surface-container/40"
        onClick={() => {
          if (hasTasks) {
            hapticLight();
            setExpanded((prev) => !prev);
          }
        }}
        aria-expanded={hasTasks ? expanded : undefined}
      >
        <div className="flex items-start gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-label-sm font-semibold text-on-primary-container">
            {getInitials(operator.name)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-label-md font-semibold text-on-surface">
                {operator.name}
              </p>
              <StatusBadge operator={operator} />
            </div>
            <p className="truncate text-[11px] text-on-surface-variant">
              {operator.sector}
            </p>

            {operator.status === 'atuando' && operator.currentMission ? (
              <div className="mt-2 space-y-1">
                <p className="truncate text-label-sm text-on-surface">
                  {operator.currentMission}
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-container">
                    <div
                      className="h-full rounded-full bg-secondary transition-all"
                      style={{ width: `${operator.progress ?? 0}%` }}
                    />
                  </div>
                  <span className="shrink-0 font-mono text-[10px] tabular-nums text-secondary">
                    {operator.progress ?? 0}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 text-[10px] text-on-surface-variant">
                  {operator.startTime ? <span>Início {operator.startTime}</span> : null}
                  {operator.expectedEnd ? (
                    <span
                      className={cn(
                        operator.isLate && 'font-semibold text-error',
                      )}
                    >
                      Previsão {operator.expectedEnd}
                      {operator.isLate ? ' · Atrasado' : ''}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}

            {operator.status === 'ocioso' && operator.idleDuration ? (
              <p className="mt-1.5 text-[11px] font-medium text-on-surface-variant">
                {operator.idleDuration}
              </p>
            ) : null}
          </div>

          {hasTasks ? (
            <ChevronDown
              className={cn(
                'mt-1 size-4 shrink-0 text-on-surface-variant transition-transform',
                expanded && 'rotate-180',
              )}
              aria-hidden
            />
          ) : null}
        </div>

        <div className="mt-2.5">
          <OperadorPausaResumoCompact operator={operator} />
        </div>
      </button>

      {hasTasks && expanded ? (
        <div className="border-t border-outline-variant/60 bg-surface-container/30 px-3 py-2.5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-secondary">
            Fila de tarefas
          </p>
          <ul className="space-y-2">
            {operator.tasks?.map((task) => (
              <li
                key={task.id}
                className="rounded-md border border-outline-variant/50 bg-surface px-2.5 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate font-mono text-label-sm text-on-surface">
                    {task.label}
                  </p>
                  <span
                    className={cn(
                      'shrink-0 text-[10px] font-semibold uppercase',
                      task.status === 'em_andamento'
                        ? 'text-secondary'
                        : 'text-on-surface-variant',
                    )}
                  >
                    {task.status === 'em_andamento' ? 'Ativo' : 'Pendente'}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-on-surface-variant">
                  {task.startTime ? <span>Início {task.startTime}</span> : null}
                  {task.expectedEndTime ? (
                    <span className={cn(task.isLate && 'font-semibold text-error')}>
                      Término {task.expectedEndTime}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
