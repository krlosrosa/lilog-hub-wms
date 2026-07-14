import Link from 'next/link';

import { Ban, Edit, Key, LockOpen, UserX } from 'lucide-react';

import { cn } from '@lilog/ui';

import {
  compactTableCellClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { PessoaAcessoBadge } from '@/features/pessoas/components/pessoa-acesso-badge';
import { PessoaEquipeBadge } from '@/features/pessoas/components/pessoa-equipe-badge';
import { PessoaStatusBadge } from '@/features/pessoas/components/pessoa-status-badge';
import {
  PESSOA_PERFIL_LABELS,
  type PessoaRecord,
} from '@/features/pessoas/types/pessoa.schema';

type PessoaTableRowProps = {
  pessoa: PessoaRecord;
  onResetSenha: (id: string) => void;
  onBloquear: (id: string) => void;
  onDesbloquear: (id: string) => void;
  onDesligar: (id: string) => void;
};

function getInitials(nome: string) {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

const actionButtonClassName =
  'rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-highest';

export function PessoaTableRow({
  pessoa,
  onResetSenha,
  onBloquear,
  onDesbloquear,
  onDesligar,
}: PessoaTableRowProps) {
  const acessoBloqueado = pessoa.acesso === 'bloqueado';
  const temAcesso = pessoa.acesso !== 'sem_acesso';

  return (
    <tr className={compactTableRowClassName}>
      <td className={compactTableCellClassName}>
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
            <span className="text-[10px] font-bold text-primary">
              {getInitials(pessoa.nome)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">
              {pessoa.nome}
            </p>
            <p className="truncate font-mono text-[10px] text-muted-foreground">
              #{pessoa.matricula}
            </p>
            {pessoa.equipeNome ? (
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground lg:hidden">
                {pessoa.equipeNome}
              </p>
            ) : null}
          </div>
        </div>
      </td>
      <td className={cn(compactTableCellClassName, 'hidden md:table-cell')}>
        <p className="truncate text-xs text-foreground">{pessoa.cargo}</p>
      </td>
      <td className={cn(compactTableCellClassName, 'hidden lg:table-cell')}>
        <PessoaEquipeBadge nome={pessoa.equipeNome} compact />
      </td>
      <td className={cn(compactTableCellClassName, 'text-center')}>
        <PessoaStatusBadge status={pessoa.situacao} compact />
      </td>
      <td className={cn(compactTableCellClassName, 'text-center')}>
        <div className="flex flex-col items-center gap-0.5">
          <PessoaAcessoBadge acesso={pessoa.acesso} compact />
          {pessoa.perfil ? (
            <p className="text-[9px] text-muted-foreground">
              {PESSOA_PERFIL_LABELS[pessoa.perfil]}
            </p>
          ) : null}
        </div>
      </td>
      <td className={cn(compactTableCellClassName, 'text-right')}>
        <div className="flex justify-end gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <Link
            href={`/pessoas/novo?id=${pessoa.id}`}
            className={cn(actionButtonClassName, 'hover:bg-primary/10 hover:text-primary')}
            title="Editar"
            aria-label={`Editar ${pessoa.nome}`}
          >
            <Edit className="size-3.5" aria-hidden />
          </Link>
          {temAcesso ? (
            <>
              <button
                type="button"
                onClick={() => onResetSenha(pessoa.id)}
                className={cn(
                  actionButtonClassName,
                  'hover:bg-secondary/10 hover:text-secondary',
                )}
                title="Resetar senha"
                aria-label={`Resetar senha de ${pessoa.nome}`}
              >
                <Key className="size-3.5" aria-hidden />
              </button>
              {acessoBloqueado ? (
                <button
                  type="button"
                  onClick={() => onDesbloquear(pessoa.id)}
                  className={cn(
                    actionButtonClassName,
                    'text-destructive hover:bg-destructive/10',
                  )}
                  title="Desbloquear"
                  aria-label={`Desbloquear ${pessoa.nome}`}
                >
                  <LockOpen className="size-3.5" aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onBloquear(pessoa.id)}
                  className={cn(
                    actionButtonClassName,
                    'hover:bg-destructive/10 hover:text-destructive',
                  )}
                  title="Bloquear acesso"
                  aria-label={`Bloquear ${pessoa.nome}`}
                >
                  <Ban className="size-3.5" aria-hidden />
                </button>
              )}
            </>
          ) : null}
          <button
            type="button"
            onClick={() => onDesligar(pessoa.id)}
            className={cn(
              actionButtonClassName,
              'hover:bg-destructive/10 hover:text-destructive',
            )}
            title="Desligar"
            aria-label={`Desligar ${pessoa.nome}`}
          >
            <UserX className="size-3.5" aria-hidden />
          </button>
        </div>
      </td>
    </tr>
  );
}
