import { cn } from '@lilog/ui';

import type { DebitoStatus } from '@/features/debito-transportadora/types/debito.schema';
import { DEBITO_STATUS_LABELS } from '@/features/debito-transportadora/types/debito.schema';

type DebitoStatusBadgeProps = {
  status: DebitoStatus;
  compact?: boolean;
  className?: string;
};

const STATUS_DOT: Record<
  DebitoStatus,
  { dot: string; pulse?: boolean }
> = {
  aberto: { dot: 'bg-amber-400', pulse: true },
  em_analise: { dot: 'bg-secondary', pulse: true },
  aprovado: { dot: 'bg-primary' },
  incluido_em_documento: { dot: 'bg-tertiary' },
  cancelado: { dot: 'bg-muted-foreground' },
};

const COMPACT_STATUS_LABELS: Record<DebitoStatus, string> = {
  aberto: 'Aberto',
  em_analise: 'Em Análise',
  aprovado: 'Aprovado',
  incluido_em_documento: 'Incl. Doc.',
  cancelado: 'Cancelado',
};

export function DebitoStatusBadge({
  status,
  compact = false,
  className,
}: DebitoStatusBadgeProps) {
  const config = STATUS_DOT[status];
  const label = compact
    ? COMPACT_STATUS_LABELS[status]
    : DEBITO_STATUS_LABELS[status];

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
