'use client';

import type { ReactNode } from 'react';

import { cn } from '@lilog/ui';

import type { RecebimentoStatus } from '@/features/recebimento/types/recebimento-lista.schema';

export const RECEBIMENTO_STATUS_LABELS: Record<RecebimentoStatus, string> = {
  'em-transito': 'Em trânsito',
  descarregando: 'Descarregando',
  agendado: 'Agendado',
  concluido: 'Concluído',
};

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

  if (status === 'descarregando') {
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
        {labels.descarregando}
      </span>
    );
  } else if (status === 'em-transito') {
    content = (
      <span
        className={cn(
          'rounded-full bg-destructive/15 font-semibold text-destructive',
          sizeClass,
        )}
      >
        {labels['em-transito']}
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
  } else {
    content = (
      <span
        className={cn(
          'rounded-full bg-primary/15 font-semibold text-primary',
          sizeClass,
        )}
      >
        {labels.concluido}
      </span>
    );
  }

  return (
    <span className="inline-flex" role="status">
      {content}
    </span>
  );
}
