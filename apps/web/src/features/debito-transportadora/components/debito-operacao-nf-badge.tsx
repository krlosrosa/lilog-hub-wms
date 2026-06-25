import { cn } from '@lilog/ui';

import type { DebitoOperacaoNf } from '@/features/debito-transportadora/types/debito.schema';
import {
  DEBITO_OPERACAO_NF_LABELS,
  DEBITO_OPERACAO_NF_SHORT,
} from '@/features/debito-transportadora/types/debito.schema';

type DebitoOperacaoNfBadgeProps = {
  operacao: DebitoOperacaoNf;
  short?: boolean;
  className?: string;
};

const OPERACAO_STYLES: Record<DebitoOperacaoNf, string> = {
  reentrega:
    'border-primary/30 bg-primary/10 text-primary',
  devolucao_parcial:
    'border-secondary/40 bg-secondary/15 text-secondary',
  devolucao_total:
    'border-destructive/40 bg-destructive/15 text-destructive',
};

export function DebitoOperacaoNfBadge({
  operacao,
  short = false,
  className,
}: DebitoOperacaoNfBadgeProps) {
  const label = short
    ? DEBITO_OPERACAO_NF_SHORT[operacao]
    : DEBITO_OPERACAO_NF_LABELS[operacao];

  return (
    <span
      className={cn(
        'inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap',
        OPERACAO_STYLES[operacao],
        className,
      )}
    >
      {label}
    </span>
  );
}
