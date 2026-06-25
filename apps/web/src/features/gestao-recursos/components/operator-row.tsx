import { ChevronDown, ChevronRight, Coffee, UserPlus } from 'lucide-react';

import { Button, cn } from '@lilog/ui';
import {
  badgeProcessoMapaClassName,
  labelProcessoMapa,
} from '@/features/gestao-recursos/components/processo-mapa-combobox';
import {
  compactTableCellClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import type { Operator } from '@/features/gestao-recursos/types/gestao-recursos.schema';
import { formatarTempoEsperado } from '@/features/config-operacional/lib/formatar-tempo-esperado';
import { UsuarioAvatar } from '@/features/usuarios/components/usuario-avatar';

type OperatorRowProps = {
  operator: Operator;
  isExpanded: boolean;
  onToggle: (operatorId: string) => void;
  onAssignTask?: (operatorId: string) => void;
  onFinalizarDemanda?: (
    demandaId: string,
    mapaTitulo?: string,
    operatorId?: string,
  ) => void;
  isAssigning?: boolean;
  finalizandoDemandaId?: string | null;
};

export function OperatorRow({
  operator,
  isExpanded,
  onToggle,
  onAssignTask,
  onFinalizarDemanda,
  isAssigning,
  finalizandoDemandaId,
}: OperatorRowProps) {
  const hasTasks = Boolean(operator.tasks?.length);

  return (
    <>
      <tr className={cn(compactTableRowClassName, 'hover:bg-primary/5')}>
        <td className={cn(compactTableCellClassName, 'w-7 pl-2')}>
          {hasTasks ? (
            <button
              type="button"
              onClick={() => onToggle(operator.id)}
              className="rounded p-0.5 text-primary transition-colors hover:bg-primary/10"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Recolher tarefas' : 'Expandir tarefas'}
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              )}
            </button>
          ) : null}
        </td>
        <td className={compactTableCellClassName}>
          <div className="flex items-center gap-2">
            <UsuarioAvatar
              nome={operator.name}
              size="sm"
              variant="primary"
              className="shrink-0"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate font-medium text-foreground">{operator.name}</p>
                {operator.emPausa ? (
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 rounded px-1 py-px text-[9px] font-semibold uppercase',
                      operator.isPauseOverPlanned
                        ? 'bg-destructive/15 text-destructive'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Coffee className="h-2.5 w-2.5" aria-hidden />
                    Pausa
                  </span>
                ) : operator.precisaPausa ? (
                  <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/15 px-1 py-px text-[9px] font-semibold uppercase text-amber-700 dark:text-amber-300">
                    <Coffee className="h-2.5 w-2.5" aria-hidden />
                    Pausa devida
                  </span>
                ) : null}
              </div>
              <p className="truncate text-[10px] text-muted-foreground">{operator.sector}</p>
            </div>
          </div>
        </td>
        <td className={cn(compactTableCellClassName, 'font-mono text-[11px] text-foreground')}>
          {operator.currentMission}
        </td>
        <td className={compactTableCellClassName}>
          <div className="flex min-w-[5.5rem] items-center gap-1.5">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-high">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${operator.progress ?? 0}%` }}
              />
            </div>
            <span className="w-7 text-right text-[10px] font-semibold tabular-nums text-primary">
              {operator.progress}%
            </span>
          </div>
        </td>
        <td className={cn(compactTableCellClassName, 'font-mono text-[11px] tabular-nums text-muted-foreground')}>
          {operator.startTime ?? '—'}
        </td>
        <td className={compactTableCellClassName}>
          {operator.isLate ? (
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] font-semibold tabular-nums text-destructive">
                {operator.expectedEnd ?? '—'}
              </span>
              <span className="rounded bg-destructive/15 px-1 py-px text-[9px] font-semibold uppercase text-destructive">
                Atrasado
              </span>
            </div>
          ) : (
            <span className="font-mono text-[11px] tabular-nums text-foreground">
              {operator.expectedEnd ?? '—'}
            </span>
          )}
        </td>
        <td className={cn(compactTableCellClassName, 'text-right')}>
          {onAssignTask ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground opacity-70 transition-opacity hover:text-primary group-hover:opacity-100"
              disabled={isAssigning}
              onClick={() => onAssignTask(operator.id)}
              aria-label={`Atribuir mais mapas a ${operator.name}`}
            >
              <UserPlus className="h-3.5 w-3.5" aria-hidden />
            </Button>
          ) : null}
        </td>      </tr>

      {hasTasks && isExpanded ? (
        <tr className="bg-surface-lowest/40">
          <td className="px-2 py-2" colSpan={7}>
            <div className="border-l-2 border-primary/25 pl-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                Fila de tarefas
              </p>
              <table className="w-full border-collapse text-left text-[11px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    <th className="pb-1 pr-2 font-medium" scope="col">Tarefa</th>
                    <th className="pb-1 pr-2 font-medium" scope="col">Mapa grupo ID</th>
                    <th className="pb-1 pr-2 font-medium" scope="col">Início</th>
                    <th className="pb-1 pr-2 font-medium" scope="col">Previsão término</th>
                    <th className="pb-1 text-right font-medium" scope="col">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {operator.tasks?.map((task) => (
                    <tr key={task.id} className="text-foreground">
                      <td className="py-1 pr-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono">{task.label}</span>
                          {task.processo ? (
                            <span
                              className={cn(
                                'rounded px-1 py-px text-[9px] font-semibold uppercase',
                                badgeProcessoMapaClassName(task.processo),
                              )}
                            >
                              {labelProcessoMapa(task.processo)}
                            </span>
                          ) : null}
                        </div>
                        {task.estimatedSeconds ? (
                          <span className="ml-1.5 text-[10px] text-muted-foreground">
                            ({formatarTempoEsperado(task.estimatedSeconds).minutos} min
                            {task.pausaExtraMinutos
                              ? ` + ${task.pausaExtraMinutos} min pausa`
                              : ''}
                            )
                          </span>
                        ) : null}
                      </td>
                      <td
                        className="max-w-[8rem] truncate py-1 pr-2 font-mono text-[10px] text-muted-foreground"
                        title={task.mapaGrupoId}
                      >
                        {task.mapaGrupoId ?? '—'}
                      </td>
                      <td className="py-1 pr-2 font-mono tabular-nums text-muted-foreground">
                        {task.startTime ?? '—'}
                      </td>
                      <td className="py-1 pr-2 font-mono tabular-nums text-muted-foreground">
                        {task.isLate ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-destructive">
                              {task.expectedEndTime ?? '—'}
                            </span>
                            <span className="rounded bg-destructive/15 px-1 py-px text-[9px] font-semibold uppercase text-destructive">
                              Atrasado
                            </span>
                          </div>
                        ) : (
                          task.expectedEndTime ?? '—'
                        )}
                      </td>
                      <td className="py-1 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {task.status === 'pendente' ? (
                            <span className="text-[10px] text-muted-foreground">
                              Pendente
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-primary">
                              Em andamento
                            </span>
                          )}
                          {onFinalizarDemanda ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-[10px]"
                              disabled={finalizandoDemandaId === task.id}
                              onClick={() =>
                                onFinalizarDemanda(
                                  task.id,
                                  task.label,
                                  operator.id,
                                )
                              }
                            >
                              Finalizar mapa
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
