'use client';

import { cn } from '@lilog/ui';

import {
  compactTableBodyClassName,
  compactTableCellClassName,
  compactTableClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import type {
  RotaDashboard,
  RotaStatus,
} from '@/features/dashboard-operacional/types/dashboard-operacional.schema';
import { ROTA_STATUS_LABELS } from '@/features/dashboard-operacional/types/dashboard-operacional.schema';

const statusBadgeClassName: Record<RotaStatus, string> = {
  em_viagem: 'bg-tertiary/15 text-tertiary ring-tertiary/20',
  entregue: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20',
  parcial: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/20',
  atrasado: 'bg-destructive/15 text-destructive ring-destructive/20',
  aguardando: 'bg-muted text-muted-foreground ring-outline-variant/30',
};

export type RotasStatusTableProps = {
  rotas: RotaDashboard[];
  className?: string;
};

export function RotasStatusTable({ rotas, className }: RotasStatusTableProps) {
  return (
    <section
      className={cn(glassPanelClassName, 'overflow-hidden', className)}
      aria-label="Status das rotas"
    >
      <header className="border-b border-outline-variant px-4 py-3 md:px-5">
        <h2 className="text-label-md font-semibold text-foreground">
          Rotas em Operação
        </h2>
        <p className="mt-1 text-caption text-muted-foreground">
          Largadas do dia com entregas e devoluções até o momento
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className={compactTableClassName}>
          <thead>
            <tr className={compactTableHeadRowClassName}>
              <th className={compactTableHeadCellClassName()}>Rota</th>
              <th className={compactTableHeadCellClassName()}>Veículo</th>
              <th className={compactTableHeadCellClassName()}>Placa</th>
              <th className={compactTableHeadCellClassName('text-right')}>
                NFs
              </th>
              <th className={compactTableHeadCellClassName('text-right')}>
                Entregues
              </th>
              <th className={compactTableHeadCellClassName('text-right')}>
                Devoluções
              </th>
              <th className={compactTableHeadCellClassName()}>Status</th>
              <th className={compactTableHeadCellClassName()}>Prev. retorno</th>
            </tr>
          </thead>
          <tbody className={compactTableBodyClassName}>
            {rotas.map((rota) => (
              <tr key={rota.id} className={compactTableRowClassName}>
                <td className={cn(compactTableCellClassName, 'font-medium')}>
                  {rota.rota}
                </td>
                <td className={compactTableCellClassName}>{rota.veiculo}</td>
                <td className={cn(compactTableCellClassName, 'tabular-nums')}>
                  {rota.placa}
                </td>
                <td
                  className={cn(
                    compactTableCellClassName,
                    'text-right tabular-nums',
                  )}
                >
                  {rota.totalNfs}
                </td>
                <td
                  className={cn(
                    compactTableCellClassName,
                    'text-right tabular-nums text-tertiary',
                  )}
                >
                  {rota.entregues}
                </td>
                <td
                  className={cn(
                    compactTableCellClassName,
                    'text-right tabular-nums text-amber-700 dark:text-amber-300',
                  )}
                >
                  {rota.devolucoes}
                </td>
                <td className={compactTableCellClassName}>
                  <span
                    className={cn(
                      'inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset',
                      statusBadgeClassName[rota.status],
                    )}
                  >
                    {ROTA_STATUS_LABELS[rota.status]}
                  </span>
                </td>
                <td
                  className={cn(
                    compactTableCellClassName,
                    'tabular-nums text-muted-foreground',
                  )}
                >
                  {rota.previsaoRetorno}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
