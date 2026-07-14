import Link from 'next/link';

import { Ban, Edit, Key, LockOpen, Trash2 } from 'lucide-react';

import { cn } from '@lilog/ui';

import {
  compactTableCellClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { UsuarioAvatar } from '@/features/usuarios/components/usuario-avatar';
import { UsuarioStatusBadge } from '@/features/usuarios/components/usuario-status-badge';
import type { UsuarioRecord } from '@/features/usuarios/types/usuarios-gestao.schema';
import { USUARIO_PERFIL_LABELS } from '@/features/usuarios/types/usuarios-gestao.schema';

type UsuarioTableRowProps = {
  usuario: UsuarioRecord;
  onResetSenha: (id: string) => void;
  onSuspender: (id: string) => void;
  onDesbloquear: (id: string) => void;
  onExcluir: (id: string) => void;
};

function getAvatarVariant(usuario: UsuarioRecord) {
  if (usuario.status === 'bloqueado') return 'destructive' as const;
  if (usuario.perfil === 'admin') return 'primary' as const;
  if (usuario.status === 'ativo') return 'tertiary' as const;
  return 'default' as const;
}

function getPerfilBadgeClass(perfil: UsuarioRecord['perfil']) {
  if (perfil === 'admin') {
    return 'border-secondary/20 bg-secondary-container/30 text-secondary';
  }
  return 'border-outline-variant bg-surface-highest text-muted-foreground';
}

export function UsuarioTableRow({
  usuario,
  onResetSenha,
  onSuspender,
  onDesbloquear,
  onExcluir,
}: UsuarioTableRowProps) {
  const isBlocked = usuario.status === 'bloqueado';

  return (
    <tr className={compactTableRowClassName}>
      <td className={compactTableCellClassName}>
        <div className="flex min-w-0 items-center gap-2">
          <UsuarioAvatar
            nome={usuario.nome}
            avatarUrl={usuario.avatarUrl}
            variant={getAvatarVariant(usuario)}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-foreground">
              {usuario.nome}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {usuario.email}
            </p>
          </div>
        </div>
      </td>
      <td className={compactTableCellClassName}>
        <span
          className={cn(
            'rounded border px-1.5 py-0 text-[9px] font-bold uppercase tracking-tight',
            getPerfilBadgeClass(usuario.perfil),
          )}
        >
          {USUARIO_PERFIL_LABELS[usuario.perfil]}
        </span>
      </td>
      <td className={cn(compactTableCellClassName, 'text-center')}>
        <UsuarioStatusBadge status={usuario.status} compact />
      </td>
      <td className={cn(compactTableCellClassName, 'hidden md:table-cell')}>
        <p
          className={cn(
            'font-mono text-[10px]',
            isBlocked ? 'text-destructive' : 'text-foreground',
          )}
        >
          {usuario.lastLogin}
        </p>
        {usuario.securityLockout ? (
          <p className="text-[9px] font-semibold text-destructive/70">
            Lockout
          </p>
        ) : usuario.lastLoginIp ? (
          <p className="text-[9px] text-muted-foreground">
            {usuario.lastLoginIp}
          </p>
        ) : null}
      </td>
      <td className={cn(compactTableCellClassName, 'text-right')}>
        <div className="flex justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Link
            href={`/usuarios/novo?id=${usuario.id}`}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            title="Editar usuário"
            aria-label={`Editar ${usuario.nome}`}
          >
            <Edit className="size-3.5" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={() => onResetSenha(usuario.id)}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary/10 hover:text-secondary"
            title="Resetar senha"
            aria-label={`Resetar senha de ${usuario.nome}`}
          >
            <Key className="size-3.5" aria-hidden />
          </button>
          {isBlocked ? (
            <>
              <button
                type="button"
                onClick={() => onDesbloquear(usuario.id)}
                className="rounded p-1 text-destructive transition-colors hover:bg-destructive/20"
                title="Desbloquear"
                aria-label={`Desbloquear ${usuario.nome}`}
              >
                <LockOpen className="size-3.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onExcluir(usuario.id)}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                title="Excluir"
                aria-label={`Excluir ${usuario.nome}`}
              >
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onSuspender(usuario.id)}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              title="Suspender"
              aria-label={`Suspender ${usuario.nome}`}
            >
              <Ban className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
