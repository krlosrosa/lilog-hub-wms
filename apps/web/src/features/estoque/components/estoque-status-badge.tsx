'use client';

import { cn } from '@lilog/ui';

import type { NaturezaSaldo } from '@/features/estoque/types/estoque.api';
import {
  NATUREZA_SALDO_LABELS,
  STATUS_SALDO_LABELS,
} from '@/features/estoque/types/estoque-gestao.schema';
import type { StatusSaldoEndereco } from '@/features/estoque/types/estoque.api';

type EstoqueStatusBadgeProps = {
  variant: 'status' | 'natureza' | 'vencimento';
  value?: StatusSaldoEndereco | NaturezaSaldo;
  compact?: boolean;
};

const STATUS_TONE: Record<StatusSaldoEndereco, string> = {
  liberado: 'bg-tertiary/15 text-tertiary',
  bloqueado: 'bg-destructive/15 text-destructive',
};

const NATUREZA_TONE: Record<NaturezaSaldo, string> = {
  fisico: 'bg-primary/15 text-primary',
  debito: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
};

export function EstoqueStatusBadge({
  variant,
  value,
  compact = false,
}: EstoqueStatusBadgeProps) {
  if (variant === 'vencimento') {
    return (
      <span
        className={cn(
          'inline-flex rounded-md font-semibold uppercase tracking-wide',
          compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]',
          'bg-amber-500/15 text-amber-700 dark:text-amber-400',
        )}
      >
        Vence em breve
      </span>
    );
  }

  if (!value) {
    return null;
  }

  const label =
    variant === 'status'
      ? STATUS_SALDO_LABELS[value as StatusSaldoEndereco]
      : NATUREZA_SALDO_LABELS[value as NaturezaSaldo];

  const tone =
    variant === 'status'
      ? STATUS_TONE[value as StatusSaldoEndereco]
      : NATUREZA_TONE[value as NaturezaSaldo];

  return (
    <span
      className={cn(
        'inline-flex rounded-md font-semibold uppercase tracking-wide',
        compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]',
        tone,
      )}
    >
      {label}
    </span>
  );
}
