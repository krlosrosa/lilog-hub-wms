'use client';

import type { ReactNode } from 'react';

import { cn } from '@lilog/ui';

import {
  RECEBIMENTO_STATUS_LABELS,
  type RecebimentoStatus,
} from '@/features/recebimento/types/recebimento-lista.schema';

type RecebimentoStatusBadgeProps = {
  status: RecebimentoStatus;
  compact?: boolean;
};

export function RecebimentoStatusBadge({
  status,
  compact,
}: RecebimentoStatusBadgeProps) {
  const labels = RECEBIMENTO_STATUS_LABELS;
  const sizeClass = compact
    ? 'px-1.5 py-px text-[9px]'
    : 'px-2.5 py-0.5 text-xs';
  let content: ReactNode;

  if (status === 'em_conferencia') {
    content = (
      <span
        className={cn(
          'inline-flex w-fit items-center gap-1 rounded-full bg-tertiary/15 font-semibold text-tertiary',
          sizeClass,
        )}
      >
        <span
          className="size-1 animate-pulse rounded-full bg-tertiary"
          aria-hidden
        />
        {labels.em_conferencia}
      </span>
    );
  } else if (status === 'liberado_para_conferencia') {
    content = (
      <span
        className={cn(
          'rounded-full bg-secondary/15 font-semibold text-secondary-foreground',
          sizeClass,
        )}
      >
        {labels.liberado_para_conferencia}
      </span>
    );
  } else if (status === 'agendado') {
    content = (
      <span
        className={cn(
          'rounded-full bg-muted font-semibold text-muted-foreground',
          sizeClass,
        )}
      >
        {labels.agendado}
      </span>
    );
  } else if (status === 'aguardando') {
    content = (
      <span
        className={cn(
          'inline-flex w-fit items-center gap-1 rounded-full bg-amber-500/15 font-semibold text-amber-700 dark:text-amber-400',
          sizeClass,
        )}
      >
        <span
          className="size-1 animate-pulse rounded-full bg-amber-500"
          aria-hidden
        />
        {labels.aguardando}
      </span>
    );
  } else if (status === 'conferido') {
    content = (
      <span
        className={cn(
          'rounded-full bg-amber-500/15 font-semibold text-amber-700 dark:text-amber-400',
          sizeClass,
        )}
      >
        {labels.conferido}
      </span>
    );
  } else if (status === 'cancelado') {
    content = (
      <span
        className={cn(
          'rounded-full bg-destructive/15 font-semibold text-destructive',
          sizeClass,
        )}
      >
        {labels.cancelado}
      </span>
    );
  } else {
    content = (
      <span
        className={cn(
          'rounded-full bg-primary/15 font-semibold text-primary',
          sizeClass,
        )}
      >
        {labels.finalizado}
      </span>
    );
  }

  return (
    <span className="inline-flex" role="status">
      {content}
    </span>
  );
}
