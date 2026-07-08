'use client';

import { AlertTriangle, Eye } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import {
  compactTableBodyClassName,
  compactTableCellClassName,
  compactTableClassName,
  compactTableEmptyCellClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { PrioridadeTransporteBadge } from '@/features/transporte/components/prioridade-transporte-badge';
import { TransporteStatusBadge } from '@/features/transporte/components/transporte-status-badge';
import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import { SwitchToggle } from '@/features/expedicao-config-mapa/components/switch-toggle';
import { ProcessoStatusBadge } from '@/features/torre-controle-expedicao/components/processo-status-badge';
import { RiscoBadge } from '@/features/torre-controle-expedicao/components/risco-badge';
import { BadgeAtrasoExpedicao } from '@/features/torre-controle-expedicao/components/tempo-restante-expedicao';
import {
  formatarDuracaoSegundos,
  metaLargadaClassName,
} from '@/features/torre-controle-expedicao/lib/formatar-tempo';
import {
  STATUS_TRANSPORTE_TORRE_LABELS,
  statusTransporteTorreSchema,
  type StatusTransporteTorre,
  type TransporteRisco,
} from '@/features/torre-controle-expedicao/types/torre-controle.schema';

const STATUS_CHIP_VARIANTE: Record<StatusTransporteTorre, 'default' | 'success' | 'warning' | 'destructive'> = {
  PENDENTE: 'default',
  ALOCADO: 'default',
  PARCIAL: 'warning',
  EM_SEPARACAO: 'warning',
  SEPARADO: 'success',
  EM_CONFERENCIA: 'warning',
  CONFERIDO: 'success',
  EM_CARREGAMENTO: 'warning',
  CARREGADO: 'success',
  EM_VIAGEM: 'success',
  VIAGEM_FINALIZADA: 'default',
};

function statusChipClassName(ativo: boolean, variante: 'default' | 'success' | 'warning' | 'destructive') {
  return cn(
    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors whitespace-nowrap',
    ativo
      ? variante === 'destructive'
        ? 'bg-destructive/15 text-destructive ring-1 ring-inset ring-destructive/25'
        : variante === 'success'
          ? 'bg-emerald-500/15 text-emerald-600 ring-1 ring-inset ring-emerald-500/25 dark:text-emerald-400'
          : variante === 'warning'
            ? 'bg-amber-500/15 text-amber-600 ring-1 ring-inset ring-amber-500/25 dark:text-amber-400'
            : 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/20'
      : 'bg-surface-highest/60 text-muted-foreground ring-1 ring-inset ring-outline-variant/50 hover:bg-surface-highest',
  );
}

export type PainelCriticidadeTableProps = {
  transportes: TransporteRisco[];
  transportesReferencia?: TransporteRisco[];
  apenasNaoFinalizados: boolean;
  onApenasNaoFinalizadosChange: (value: boolean) => void;
  filtroStatus: StatusTransporteTorre | 'todos';
  onFiltroStatusChange: (status: StatusTransporteTorre | 'todos') => void;
  contadoresStatus: Record<StatusTransporteTorre, number>;
  onVerTransporte: (transporte: TransporteRisco) => void;
  className?: string;
};

const STATUS_TODOS = statusTransporteTorreSchema.options;

export function PainelCriticidadeTable({
  transportes,
  transportesReferencia,
  apenasNaoFinalizados,
  onApenasNaoFinalizadosChange,
  filtroStatus,
  onFiltroStatusChange,
  contadoresStatus,
  onVerTransporte,
  className,
}: PainelCriticidadeTableProps) {
  const referencia = transportesReferencia ?? transportes;
  const emAndamento = referencia.filter(
    (transporte) => transporte.etapaAtual !== 'finalizado',
  ).length;
  const finalizados = referencia.filter(
    (transporte) => transporte.etapaAtual === 'finalizado',
  ).length;

  const statusComTransportes = STATUS_TODOS.filter(
    (s) => contadoresStatus[s] > 0,
  );

  return (
    <section
      id="painel-criticidade"
      className={cn(
        glassPanelClassName,
        'overflow-hidden rounded-xl',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant bg-surface-high/50 px-gutter py-3">
        <div className="flex flex-wrap items-center gap-2">
          <AlertTriangle className="size-4 text-destructive" aria-hidden />
          <h2 className="text-label-md font-semibold text-foreground">
            Transportes da Operação
          </h2>
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-destructive">
            {emAndamento} em andamento
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
            {finalizados} finalizados
          </span>
          {apenasNaoFinalizados ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
              {transportes.length} visíveis
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-caption text-muted-foreground">
            <SwitchToggle
              checked={apenasNaoFinalizados}
              onChange={() =>
                onApenasNaoFinalizadosChange(!apenasNaoFinalizados)
              }
              label="Filtrar apenas não finalizados"
            />
            Apenas não finalizados
          </label>
          <p className="hidden text-caption text-muted-foreground sm:block">
            Ordenado por criticidade
          </p>
        </div>
      </div>

      {statusComTransportes.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant/50 bg-surface-low/30 px-gutter py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Status
          </span>
          <button
            type="button"
            onClick={() => onFiltroStatusChange('todos')}
            className={statusChipClassName(filtroStatus === 'todos', 'default')}
          >
            Todos
            <span className="tabular-nums opacity-80">
              ({referencia.length})
            </span>
          </button>
          {statusComTransportes.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() =>
                onFiltroStatusChange(filtroStatus === status ? 'todos' : status)
              }
              className={statusChipClassName(
                filtroStatus === status,
                STATUS_CHIP_VARIANTE[status],
              )}
            >
              {STATUS_TRANSPORTE_TORRE_LABELS[status]}
              <span className="tabular-nums opacity-80">
                ({contadoresStatus[status]})
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className={compactTableClassName}>
          <thead>
            <tr className={compactTableHeadRowClassName}>
              <th className={compactTableHeadCellClassName()}>Transporte</th>
              <th className={compactTableHeadCellClassName('hidden sm:table-cell')}>
                Status
              </th>
              <th className={compactTableHeadCellClassName('hidden sm:table-cell')}>
                Prioridade
              </th>
              <th
                className={compactTableHeadCellClassName()}
                title="Horário previsto para largada do transporte"
              >
                Meta de largada
              </th>
              <th
                className={compactTableHeadCellClassName('hidden sm:table-cell')}
                title="Tempo decorrido após o horário previsto de saída"
              >
                Atraso
              </th>
              <th className={compactTableHeadCellClassName('hidden md:table-cell')}>
                Paletes
              </th>
              <th className={compactTableHeadCellClassName('hidden md:table-cell')}>
                Peso
              </th>
              <th
                className={compactTableHeadCellClassName('hidden md:table-cell')}
                title="Soma fixa do tempo previsto pelas regras operacionais dos mapas pendentes"
              >
                Tempo previsto
              </th>
              <th className={compactTableHeadCellClassName()}>Risco</th>
              <th className={compactTableHeadCellClassName('hidden md:table-cell')}>
                Separação
              </th>
              <th className={compactTableHeadCellClassName('hidden md:table-cell')}>
                Conferência
              </th>
              <th className={compactTableHeadCellClassName('hidden md:table-cell')}>
                Carregamento
              </th>
              <th className={compactTableHeadCellClassName('w-16 text-right')}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody className={compactTableBodyClassName}>
            {transportes.length === 0 ? (
              <tr>
                <td colSpan={13} className={compactTableEmptyCellClassName}>
                  {apenasNaoFinalizados
                    ? 'Nenhum transporte em andamento para os filtros atuais.'
                    : 'Nenhum transporte encontrado para o lote selecionado.'}
                </td>
              </tr>
            ) : (
              transportes.map((transporte) => {
                const finalizado = transporte.etapaAtual === 'finalizado';
                const prioridadeNaoIniciada =
                  !finalizado &&
                  transporte.prioridade &&
                  transporte.etapaAtual === 'separacao' &&
                  transporte.mapasConcluidos === 0;

                return (
                  <tr
                    key={transporte.id}
                    className={cn(
                      compactTableRowClassName,
                      'cursor-pointer',
                      finalizado && 'bg-muted/20 text-muted-foreground',
                      prioridadeNaoIniciada &&
                        'border-l-4 border-l-destructive bg-destructive/5',
                    )}
                    onClick={() => onVerTransporte(transporte)}
                  >
                    <td className={compactTableCellClassName}>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground">
                          {transporte.codigo}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {transporte.placa} · {transporte.transportadora}
                        </span>
                      </div>
                    </td>
                    <td
                      className={cn(
                        compactTableCellClassName,
                        'hidden sm:table-cell',
                      )}
                    >
                      <TransporteStatusBadge status={transporte.status} />
                    </td>
                    <td
                      className={cn(
                        compactTableCellClassName,
                        'hidden sm:table-cell',
                      )}
                    >
                      {transporte.isPrioridade && transporte.nivelPrioridade ? (
                        <PrioridadeTransporteBadge
                          nivel={transporte.nivelPrioridade}
                        />
                      ) : transporte.prioridade ? (
                        <span className="inline-flex rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold text-secondary ring-1 ring-inset ring-secondary/20">
                          Reentrega
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/70">
                          —
                        </span>
                      )}
                    </td>
                    <td className={compactTableCellClassName}>
                      <span className={metaLargadaClassName}>
                        {transporte.horarioSaida}
                      </span>
                    </td>
                    <td
                      className={cn(
                        compactTableCellClassName,
                        'hidden sm:table-cell',
                      )}
                    >
                      {finalizado ? (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      ) : (
                        <BadgeAtrasoExpedicao
                          tempoRestanteSaidaMin={transporte.tempoRestanteSaidaMin}
                          tempoRestanteSaidaSeg={transporte.tempoRestanteSaidaSeg}
                        />
                      )}
                    </td>
                    <td
                      className={cn(
                        compactTableCellClassName,
                        'hidden tabular-nums md:table-cell',
                      )}
                    >
                      {transporte.volumePaletes > 0
                        ? transporte.volumePaletes
                        : '—'}
                    </td>
                    <td
                      className={cn(
                        compactTableCellClassName,
                        'hidden tabular-nums md:table-cell',
                      )}
                    >
                      {transporte.pesoTotalKg > 0
                        ? `${transporte.pesoTotalKg.toLocaleString('pt-BR')} kg`
                        : '—'}
                    </td>
                    <td
                      className={cn(
                        compactTableCellClassName,
                        'hidden tabular-nums md:table-cell',
                      )}
                    >
                      {formatarDuracaoSegundos(
                        transporte.tempoEstimadoFinalizarSeg ??
                          transporte.tempoEstimadoFinalizarMin * 60,
                      )}
                    </td>
                    <td className={compactTableCellClassName}>
                      {finalizado ? (
                        <span className="inline-flex rounded-full border border-outline-variant bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Finalizado
                        </span>
                      ) : (
                        <RiscoBadge nivel={transporte.nivelRisco} />
                      )}
                    </td>
                    <td
                      className={cn(
                        compactTableCellClassName,
                        'hidden md:table-cell',
                      )}
                    >
                      <ProcessoStatusBadge
                        status={transporte.statusProcessos.separacao}
                        horario={transporte.horariosProcessos.separacao}
                      />
                    </td>
                    <td
                      className={cn(
                        compactTableCellClassName,
                        'hidden md:table-cell',
                      )}
                    >
                      <ProcessoStatusBadge
                        status={transporte.statusProcessos.conferencia}
                        horario={transporte.horariosProcessos.conferencia}
                      />
                    </td>
                    <td
                      className={cn(
                        compactTableCellClassName,
                        'hidden md:table-cell',
                      )}
                    >
                      <ProcessoStatusBadge
                        status={transporte.statusProcessos.carregamento}
                        horario={transporte.horariosProcessos.carregamento}
                      />
                    </td>
                    <td className={cn(compactTableCellClassName, 'text-right')}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          onVerTransporte(transporte);
                        }}
                        aria-label={`Ver detalhes ${transporte.codigo}`}
                      >
                        <Eye className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
