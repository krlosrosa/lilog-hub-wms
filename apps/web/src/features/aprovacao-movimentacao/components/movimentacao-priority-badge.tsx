'use client';

import { cn } from '@lilog/ui';

import type { MovimentacaoPrioridade } from '@/features/aprovacao-movimentacao/types/aprovacao-movimentacao.schema';
import { MOVIMENTACAO_PRIORIDADE_LABELS } from '@/features/aprovacao-movimentacao/types/aprovacao-movimentacao.schema';

type MovimentacaoPriorityBadgeProps = {
  prioridade: MovimentacaoPrioridade;
  className?: string;
};

const PRIORIDADE_STYLES: Record<
  MovimentacaoPrioridade,
  { dot: string; text: string }
> = {
  URGENTE: {
    dot: 'bg-destructive text-destructive',
    text: 'text-destructive',
  },
  ALTA: {
    dot: 'bg-tertiary text-tertiary',
    text: 'text-tertiary',
  },
  MEDIA: {
    dot: 'bg-primary text-primary',
    text: 'text-primary',
  },
  BAIXA: {
    dot: 'bg-muted-foreground text-muted-foreground',
    text: 'text-muted-foreground',
  },
};

export function MovimentacaoPriorityBadge({
  prioridade,
  className,
}: MovimentacaoPriorityBadgeProps) {
  const styles = PRIORIDADE_STYLES[prioridade];

  return (
    <span className={cn('inline-flex items-center justify-center gap-2', className)}>
      <span
        className={cn(
          'inline-block size-2 shrink-0 rounded-full shadow-[0_0_8px_currentColor]',
          styles.dot,
        )}
        aria-hidden
      />
      <span className={cn('text-[11px] font-semibold uppercase', styles.text)}>
        {MOVIMENTACAO_PRIORIDADE_LABELS[prioridade]}
      </span>
    </span>
  );
}
