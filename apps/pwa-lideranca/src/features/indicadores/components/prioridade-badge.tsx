import { cn } from '@lilog/ui';

import type { NivelPrioridadeTorre } from '@/features/indicadores/lib/torre-controle.schema';
import { NIVEL_PRIORIDADE_LABELS } from '@/features/indicadores/lib/torre-controle.schema';

const NIVEL_BADGE_CLASS: Record<NivelPrioridadeTorre, string> = {
  urgente: 'bg-destructive/15 text-destructive ring-destructive/25',
  prioritaria:
    'bg-orange-500/15 text-orange-700 ring-orange-500/25 dark:text-orange-300',
  normal: 'bg-primary/10 text-primary ring-primary/20',
  baixa: 'bg-muted text-muted-foreground ring-outline-variant/50',
};

type PrioridadeBadgeProps = {
  nivel: NivelPrioridadeTorre;
  className?: string;
};

export function PrioridadeBadge({ nivel, className }: PrioridadeBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset',
        NIVEL_BADGE_CLASS[nivel],
        className,
      )}
    >
      {NIVEL_PRIORIDADE_LABELS[nivel]}
    </span>
  );
}
