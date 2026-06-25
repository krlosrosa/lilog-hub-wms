'use client';

import { cn } from '@lilog/ui';

import {
  DOCA_SITUACAO_LABELS,
  type DocaSituacao,
} from '@/features/docas/types/docas.schema';

const SITUACAO_BADGE_CLASSES: Record<DocaSituacao, string> = {
  disponivel: 'bg-tertiary/20 text-tertiary',
  ocupada: 'bg-secondary/20 text-secondary',
  reservada: 'bg-primary/20 text-primary',
  bloqueada: 'bg-destructive/20 text-destructive',
  manutencao: 'bg-muted text-muted-foreground',
};

const SITUACAO_DOT_CLASSES: Record<DocaSituacao, string> = {
  disponivel: 'bg-tertiary',
  ocupada: 'bg-secondary',
  reservada: 'bg-primary',
  bloqueada: 'bg-destructive',
  manutencao: 'bg-muted-foreground',
};

type DocaStatusBadgeProps = {
  situacao: DocaSituacao;
  className?: string;
};

export function DocaStatusBadge({ situacao, className }: DocaStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center truncate rounded-full px-1.5 py-0 text-[9px] font-semibold',
        SITUACAO_BADGE_CLASSES[situacao],
        className,
      )}
    >
      <span
        className={cn('mr-1 size-1 shrink-0 rounded-full', SITUACAO_DOT_CLASSES[situacao])}
        aria-hidden
      />
      {DOCA_SITUACAO_LABELS[situacao]}
    </span>
  );
}
