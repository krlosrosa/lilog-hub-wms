'use client';

import { cn } from '@lilog/ui';

import {
  LINHA_SEPARACAO_STATUS_LABELS,
  type LinhaSeparacaoStatus,
} from '@/features/peso-variavel/types/peso-variavel-etiquetas.schema';

const STATUS_BADGE_CLASSES: Record<LinhaSeparacaoStatus, string> = {
  pendente:
    'border-outline-variant bg-muted/40 text-muted-foreground',
  gerado: 'border-primary/30 bg-primary/10 text-primary',
  impresso: 'border-secondary/30 bg-secondary-container/20 text-secondary',
  separado: 'border-tertiary/30 bg-status-active/15 text-status-active',
};

const STATUS_DOT_CLASSES: Record<LinhaSeparacaoStatus, string> = {
  pendente: 'bg-muted-foreground',
  gerado: 'bg-primary',
  impresso: 'bg-secondary',
  separado: 'bg-status-active',
};

type LinhaSeparacaoStatusBadgeProps = {
  status: LinhaSeparacaoStatus;
};

export function LinhaSeparacaoStatusBadge({
  status,
}: LinhaSeparacaoStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center truncate rounded-full border px-1.5 py-0 text-[9px] font-semibold',
        STATUS_BADGE_CLASSES[status],
      )}
    >
      <span
        className={cn(
          'mr-1 size-1 shrink-0 rounded-full',
          STATUS_DOT_CLASSES[status],
        )}
        aria-hidden
      />
      {LINHA_SEPARACAO_STATUS_LABELS[status]}
    </span>
  );
}
