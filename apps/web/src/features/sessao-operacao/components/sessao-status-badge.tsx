import { cn } from '@lilog/ui';

import type { SessaoTrabalhoStatusApi } from '@/features/sessao-operacao/types/sessao.api';
import { SESSAO_STATUS_LABELS } from '@/features/sessao-operacao/types/sessao.schema';

const STATUS_STYLES: Record<SessaoTrabalhoStatusApi, string> = {
  planejada: 'bg-surface-highest text-muted-foreground',
  aberta: 'bg-secondary-container text-secondary',
  encerrada: 'bg-primary/10 text-primary',
  cancelada: 'bg-destructive/10 text-destructive',
};

type SessaoStatusBadgeProps = {
  status: SessaoTrabalhoStatusApi;
  className?: string;
};

export function SessaoStatusBadge({ status, className }: SessaoStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-caption font-medium',
        STATUS_STYLES[status],
        className,
      )}
    >
      {SESSAO_STATUS_LABELS[status]}
    </span>
  );
}
