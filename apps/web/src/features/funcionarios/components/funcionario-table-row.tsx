import Link from 'next/link';

import { Edit, History } from 'lucide-react';

import { cn } from '@lilog/ui';

import {
  compactTableCellClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';

import { FuncionarioProductivityBar } from '@/features/funcionarios/components/funcionario-productivity-bar';
import { FuncionarioStatusBadge } from '@/features/funcionarios/components/funcionario-status-badge';
import type { FuncionarioRecord } from '@/features/funcionarios/types/funcionarios-gestao.schema';
import {
  FUNCIONARIO_DEPARTAMENTO_LABELS,
  FUNCIONARIO_TURNO_SHORT_LABELS,
} from '@/features/funcionarios/types/funcionarios-gestao.schema';

type FuncionarioTableRowProps = {
  funcionario: FuncionarioRecord;
  onVerHistorico: (id: string) => void;
};

function getInitials(nome: string) {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function FuncionarioTableRow({
  funcionario,
  onVerHistorico,
}: FuncionarioTableRowProps) {
  return (
    <tr className={compactTableRowClassName}>
      <td className={compactTableCellClassName}>
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={cn(
              'size-7 shrink-0 overflow-hidden rounded-full ring-1 ring-outline-variant',
              funcionario.avatarUrl ? '' : 'bg-muted',
            )}
          >
            {funcionario.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={funcionario.avatarUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center text-[10px] font-bold text-muted-foreground">
                {getInitials(funcionario.nome)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
              {funcionario.nome}
            </p>
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {funcionario.matricula}
            </p>
            <p className="truncate text-[11px] text-muted-foreground sm:hidden">
              {funcionario.cargo}
            </p>
          </div>
        </div>
      </td>
      <td className={cn(compactTableCellClassName, 'hidden sm:table-cell')}>
        <p className="max-w-[9rem] truncate text-xs text-foreground" title={funcionario.cargo}>
          {funcionario.cargo}
        </p>
      </td>
      <td className={compactTableCellClassName}>
        <p className="truncate text-xs text-muted-foreground">
          {FUNCIONARIO_DEPARTAMENTO_LABELS[funcionario.departamento]}
        </p>
        <p className="text-[11px] text-muted-foreground/80">
          {FUNCIONARIO_TURNO_SHORT_LABELS[funcionario.turno]}
        </p>
      </td>
      <td className={compactTableCellClassName}>
        <FuncionarioProductivityBar value={funcionario.produtividade} compact />
      </td>
      <td className={cn(compactTableCellClassName, 'text-center')}>
        <FuncionarioStatusBadge status={funcionario.status} />
      </td>
      <td className={compactTableCellClassName}>
        <div className="flex items-center justify-end gap-0.5">
          <Link
            href={`/funcionarios/novo?id=${funcionario.id}`}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-surface-low hover:text-primary"
            title="Editar"
            aria-label={`Editar ${funcionario.nome}`}
          >
            <Edit className="size-3.5" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={() => onVerHistorico(funcionario.id)}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-surface-low hover:text-secondary"
            title="Histórico"
            aria-label={`Histórico de ${funcionario.nome}`}
          >
            <History className="size-3.5" aria-hidden />
          </button>
        </div>
      </td>
    </tr>
  );
}
