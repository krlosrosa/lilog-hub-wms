import { cn } from '@lilog/ui';

import type { FuncionarioStatus } from '@/features/funcionarios/types/funcionarios-gestao.schema';
import { FUNCIONARIO_STATUS_LABELS } from '@/features/funcionarios/types/funcionarios-gestao.schema';

type FuncionarioStatusBadgeProps = {
  status: FuncionarioStatus;
  className?: string;
};

const statusStyles: Record<FuncionarioStatus, string> = {
  ativo: 'bg-accent/10 text-accent',
  inativo: 'bg-destructive/10 text-destructive',
};

export function FuncionarioStatusBadge({
  status,
  className,
}: FuncionarioStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest',
        statusStyles[status],
        className,
      )}
    >
      {FUNCIONARIO_STATUS_LABELS[status]}
    </span>
  );
}
