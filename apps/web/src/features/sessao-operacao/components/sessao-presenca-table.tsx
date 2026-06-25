'use client';

import type { SessaoFuncionarioApi, SessaoPresencaStatusApi } from '@/features/sessao-operacao/types/sessao.api';
import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import {
  formatDateTime,
  PRESENCA_STATUS_OPTIONS,
} from '@/features/sessao-operacao/types/sessao.schema';

type SessaoPresencaTableProps = {
  funcionarios: SessaoFuncionarioApi[];
  editavel: boolean;
  isSubmitting: boolean;
  onAtualizarPresenca: (
    funcionarioId: number,
    status: SessaoPresencaStatusApi,
  ) => void;
};

export function SessaoPresencaTable({
  funcionarios,
  editavel,
  isSubmitting,
  onAtualizarPresenca,
}: SessaoPresencaTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant">
      <table className={compactTableClassName}>
        <thead>
          <tr className={compactTableHeadRowClassName}>
            <th className={compactTableHeadCellClassName()}>Matrícula</th>
            <th className={compactTableHeadCellClassName()}>Nome</th>
            <th className={compactTableHeadCellClassName('hidden md:table-cell')}>
              Cargo
            </th>
            <th className={compactTableHeadCellClassName()}>Status</th>
            <th className={compactTableHeadCellClassName('hidden lg:table-cell')}>
              Check-in
            </th>
          </tr>
        </thead>
        <tbody className={compactTableBodyClassName}>
          {funcionarios.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-8 text-center text-body-sm text-muted-foreground"
              >
                Nenhum funcionário vinculado à equipe desta escala.
              </td>
            </tr>
          ) : (
            funcionarios.map((funcionario) => (
              <tr
                key={funcionario.id}
                className="border-b border-outline-variant/60"
              >
                <td className="px-4 py-3 text-body-sm text-foreground">
                  {funcionario.matricula}
                </td>
                <td className="px-4 py-3 text-body-sm text-foreground">
                  {funcionario.nome}
                </td>
                <td className="hidden px-4 py-3 text-body-sm text-muted-foreground md:table-cell">
                  {funcionario.cargo}
                </td>
                <td className="px-4 py-3">
                  {editavel ? (
                    <select
                      value={funcionario.status}
                      disabled={isSubmitting}
                      onChange={(event) =>
                        onAtualizarPresenca(
                          funcionario.funcionarioId,
                          event.target.value as SessaoPresencaStatusApi,
                        )
                      }
                      className="h-9 w-full min-w-[120px] rounded-lg border border-outline-variant bg-background px-2 text-body-sm"
                    >
                      {PRESENCA_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-body-sm text-foreground">
                      {
                        PRESENCA_STATUS_OPTIONS.find(
                          (opt) => opt.value === funcionario.status,
                        )?.label
                      }
                    </span>
                  )}
                </td>
                <td className="hidden px-4 py-3 text-body-sm text-muted-foreground lg:table-cell">
                  {formatDateTime(funcionario.checkIn)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
