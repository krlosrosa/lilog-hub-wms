import { cn } from '@lilog/ui';

import type { DocumentoCobrancaStatus } from '@/features/debito-transportadora/types/documento-cobranca.schema';
import { DOCUMENTO_STATUS_LABELS } from '@/features/debito-transportadora/types/documento-cobranca.schema';

type DocumentoStatusBadgeProps = {
  status: DocumentoCobrancaStatus;
  compact?: boolean;
  className?: string;
};

const STATUS_DOT: Record<
  DocumentoCobrancaStatus,
  { dot: string; pulse?: boolean }
> = {
  rascunho: { dot: 'bg-amber-400', pulse: true },
  emitido: { dot: 'bg-primary' },
  enviado: { dot: 'bg-secondary', pulse: true },
  pago: { dot: 'bg-tertiary' },
  cancelado: { dot: 'bg-muted-foreground' },
};

const COMPACT_STATUS_LABELS: Record<DocumentoCobrancaStatus, string> = {
  rascunho: 'Rascunho',
  emitido: 'Emitido',
  enviado: 'Enviado',
  pago: 'Pago',
  cancelado: 'Cancelado',
};

export function DocumentoStatusBadge({
  status,
  compact = false,
  className,
}: DocumentoStatusBadgeProps) {
  const config = STATUS_DOT[status];
  const label = compact
    ? COMPACT_STATUS_LABELS[status]
    : DOCUMENTO_STATUS_LABELS[status];

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
