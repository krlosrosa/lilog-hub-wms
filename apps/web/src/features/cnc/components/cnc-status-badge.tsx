import { cn } from '@lilog/ui';

import type { CncSituacao } from '@/features/cnc/types/cnc.schema';
import { CNC_SITUACAO_LABELS } from '@/features/cnc/types/cnc.schema';

type CncStatusBadgeProps = {
  situacao: CncSituacao;
  compact?: boolean;
  className?: string;
};

const STATUS_DOT: Record<
  CncSituacao,
  { dot: string; pulse?: boolean }
> = {
  pendente: { dot: 'bg-amber-400', pulse: true },
  em_analise: { dot: 'bg-secondary', pulse: true },
  encerrada: { dot: 'bg-primary' },
  cancelada: { dot: 'bg-muted-foreground' },
};

const COMPACT_STATUS_LABELS: Record<CncSituacao, string> = {
  pendente: 'Pendente',
  em_analise: 'Em Análise',
  encerrada: 'Encerrada',
  cancelada: 'Cancelada',
};

export function CncStatusBadge({
  situacao,
  compact = false,
  className,
}: CncStatusBadgeProps) {
  const config = STATUS_DOT[situacao];
  const label = compact
    ? COMPACT_STATUS_LABELS[situacao]
    : CNC_SITUACAO_LABELS[situacao];

  return (
    <div
      className={cn(
        'flex items-center',
        compact ? 'gap-1' : 'gap-2',
        className,
      )}
    >
      <span
        className={cn(
          'shrink-0 rounded-full',
          compact ? 'size-1.5' : 'size-2',
          config.dot,
          config.pulse && 'animate-pulse',
        )}
        aria-hidden
      />
      <span
        className={cn(
          'whitespace-nowrap text-foreground',
          compact ? 'text-[10px]' : 'text-caption',
        )}
      >
        {label}
      </span>
    </div>
  );
}
