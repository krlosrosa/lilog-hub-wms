import { cn } from '@lilog/ui';

import {
  PESSOA_SITUACAO_LABELS,
  type PessoaSituacaoUi,
} from '@/features/pessoas/types/pessoa.schema';

type PessoaStatusBadgeProps = {
  status: PessoaSituacaoUi;
  compact?: boolean;
};

function getStatusClass(status: PessoaSituacaoUi) {
  if (status === 'ativo') {
    return 'border-tertiary/20 bg-tertiary-container/30 text-tertiary';
  }
  if (status === 'bloqueado') {
    return 'border-destructive/20 bg-destructive/10 text-destructive';
  }
  return 'border-outline-variant bg-surface-highest text-muted-foreground';
}

export function PessoaStatusBadge({
  status,
  compact = false,
}: PessoaStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border font-bold uppercase tracking-tight',
        compact ? 'px-1.5 py-0 text-[9px]' : 'px-2 py-0.5 text-[10px]',
        getStatusClass(status),
      )}
    >
      {PESSOA_SITUACAO_LABELS[status]}
    </span>
  );
}
