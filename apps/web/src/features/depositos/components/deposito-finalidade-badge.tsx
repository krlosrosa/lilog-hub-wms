import { cn } from '@lilog/ui';

import type { DepositoFinalidade } from '@/features/depositos/types/deposito.api';
import { DEPOSITO_FINALIDADE_LABELS } from '@/features/depositos/types/depositos-gestao.schema';

const FINALIDADE_TONE: Record<
  DepositoFinalidade,
  { active: string; inactive: string }
> = {
  transferencia: {
    active: 'border-primary/30 bg-primary/10 text-primary',
    inactive: 'border-outline-variant/60 bg-muted text-muted-foreground',
  },
  aguardando_armazenagem: {
    active: 'border-secondary/30 bg-secondary/10 text-secondary',
    inactive: 'border-outline-variant/60 bg-muted text-muted-foreground',
  },
  geral: {
    active: 'border-tertiary/30 bg-tertiary/10 text-tertiary',
    inactive: 'border-outline-variant/60 bg-muted text-muted-foreground',
  },
  quarentena: {
    active: 'border-warning/30 bg-warning/10 text-warning',
    inactive: 'border-outline-variant/60 bg-muted text-muted-foreground',
  },
  debito_transportadora: {
    active: 'border-destructive/30 bg-destructive/10 text-destructive',
    inactive: 'border-outline-variant/60 bg-muted text-muted-foreground',
  },
  acerto_transferencia: {
    active: 'border-primary/30 bg-primary/10 text-primary',
    inactive: 'border-outline-variant/60 bg-muted text-muted-foreground',
  },
  reserva: {
    active: 'border-secondary/30 bg-secondary/10 text-secondary',
    inactive: 'border-outline-variant/60 bg-muted text-muted-foreground',
  },
  avaria: {
    active: 'border-destructive/30 bg-destructive/10 text-destructive',
    inactive: 'border-outline-variant/60 bg-muted text-muted-foreground',
  },
  bloqueado: {
    active: 'border-destructive/30 bg-destructive/10 text-destructive',
    inactive: 'border-outline-variant/60 bg-muted text-muted-foreground',
  },
};

type DepositoFinalidadeBadgeProps = {
  finalidade: DepositoFinalidade;
  compact?: boolean;
  muted?: boolean;
};

export function DepositoFinalidadeBadge({
  finalidade,
  compact = false,
  muted = false,
}: DepositoFinalidadeBadgeProps) {
  const tone =
    FINALIDADE_TONE[finalidade] ??
    FINALIDADE_TONE.geral;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-semibold uppercase tracking-wide',
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]',
        muted ? tone.inactive : tone.active,
      )}
    >
      {DEPOSITO_FINALIDADE_LABELS[finalidade]}
    </span>
  );
}

type DepositoStatusBadgeProps = {
  ativo: boolean;
  compact?: boolean;
};

export function DepositoStatusBadge({
  ativo,
  compact = false,
}: DepositoStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-semibold uppercase tracking-wide',
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]',
        ativo
          ? 'border-tertiary/30 bg-tertiary/10 text-tertiary'
          : 'border-outline-variant/60 bg-muted text-muted-foreground',
      )}
    >
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  );
}

type DepositoSistemaBadgeProps = {
  sistema: boolean;
  compact?: boolean;
};

export function DepositoSistemaBadge({
  sistema,
  compact = false,
}: DepositoSistemaBadgeProps) {
  if (!sistema) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-md border border-outline-variant/60 bg-surface-highest font-medium text-muted-foreground',
          compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]',
        )}
      >
        Customizado
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-primary/30 bg-primary/10 font-semibold uppercase tracking-wide text-primary',
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]',
      )}
    >
      Sistema
    </span>
  );
}
