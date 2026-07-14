import { cn } from '@lilog/ui';

import {
  PESSOA_ACESSO_LABELS,
  type PessoaAcessoUi,
} from '@/features/pessoas/types/pessoa.schema';

type PessoaAcessoBadgeProps = {
  acesso: PessoaAcessoUi;
  compact?: boolean;
};

function getAcessoClass(acesso: PessoaAcessoUi) {
  if (acesso === 'ativo') {
    return 'border-secondary/20 bg-secondary-container/30 text-secondary';
  }
  if (acesso === 'bloqueado') {
    return 'border-destructive/20 bg-destructive/10 text-destructive';
  }
  if (acesso === 'sem_acesso') {
    return 'border-outline-variant bg-surface-highest text-muted-foreground';
  }
  return 'border-outline-variant bg-surface-low text-muted-foreground';
}

export function PessoaAcessoBadge({
  acesso,
  compact = false,
}: PessoaAcessoBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border font-bold uppercase tracking-tight',
        compact ? 'px-1.5 py-0 text-[9px]' : 'px-2 py-0.5 text-[10px]',
        getAcessoClass(acesso),
      )}
    >
      {PESSOA_ACESSO_LABELS[acesso]}
    </span>
  );
}
