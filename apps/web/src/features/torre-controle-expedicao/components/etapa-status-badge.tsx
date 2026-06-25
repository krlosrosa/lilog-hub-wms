import { cn } from '@lilog/ui';

import { accentSubtleBadgeBorderClassName } from '@/lib/semantic-badge-classes';
import type { EtapaOperacional } from '@/features/torre-controle-expedicao/types/torre-controle.schema';
import { ETAPA_OPERACIONAL_LABELS } from '@/features/torre-controle-expedicao/types/torre-controle.schema';

const ETAPA_STYLES: Record<EtapaOperacional, string> = {
  separacao: 'bg-primary/10 text-primary border-primary/25',
  conferencia: 'bg-tertiary-container text-tertiary border-tertiary/25',
  carregamento: cn('border', accentSubtleBadgeBorderClassName),
  finalizado: 'bg-muted text-muted-foreground border-outline-variant',
};

export type EtapaStatusBadgeProps = {
  etapa: EtapaOperacional;
  className?: string;
};

export function EtapaStatusBadge({ etapa, className }: EtapaStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
        ETAPA_STYLES[etapa],
        className,
      )}
    >
      {ETAPA_OPERACIONAL_LABELS[etapa]}
    </span>
  );
}
