import { cn } from '@lilog/ui';

import type { UsuarioStatus } from '@/features/usuarios/types/usuarios-gestao.schema';
import { USUARIO_STATUS_LABELS } from '@/features/usuarios/types/usuarios-gestao.schema';

type UsuarioStatusBadgeProps = {
  status: UsuarioStatus;
  compact?: boolean;
  className?: string;
};

const statusStyles: Record<UsuarioStatus, string> = {
  ativo:
    'border-tertiary/20 bg-tertiary/10 text-tertiary',
  inativo:
    'border-outline-variant bg-surface-highest text-muted-foreground',
  bloqueado:
    'border-destructive/30 bg-destructive/10 text-destructive',
};

export function UsuarioStatusBadge({
  status,
  compact = false,
  className,
}: UsuarioStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-bold',
        compact ? 'px-1.5 py-0 text-[9px]' : 'px-2 py-0.5 text-[10px]',
        statusStyles[status],
        className,
      )}
    >
      {status === 'ativo' && (
        <span
          className={cn(
            'rounded-full bg-tertiary',
            compact ? 'mr-1 size-1 animate-pulse' : 'mr-1.5 size-1 animate-pulse',
          )}
          aria-hidden
        />
      )}
      {USUARIO_STATUS_LABELS[status]}
    </span>
  );
}
