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
  em_disputa: { dot: 'bg-amber-400', pulse: true },
  notificada: { dot: 'bg-primary' },
  pago: { dot: 'bg-tertiary' },
  aguardando_evidencia: { dot: 'bg-secondary' },
};

const COMPACT_STATUS_LABELS: Record<DebitoStatus, string> = {
  em_disputa: 'Disputa',
  notificada: 'Notificada',
  pago: 'Pago',
  aguardando_evidencia: 'Aguard. Evid.',
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
