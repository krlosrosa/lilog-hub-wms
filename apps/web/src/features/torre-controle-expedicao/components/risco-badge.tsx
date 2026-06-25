import { cn } from '@lilog/ui';

import type { NivelRisco } from '@/features/torre-controle-expedicao/types/torre-controle.schema';
import { NIVEL_RISCO_LABELS } from '@/features/torre-controle-expedicao/types/torre-controle.schema';

const RISCO_STYLES: Record<
  NivelRisco,
  { chip: string; pulse?: boolean }
> = {
  critico: {
    chip: 'bg-destructive/15 text-destructive border-destructive/30',
    pulse: true,
  },
  alto: {
    chip: 'bg-tertiary-container text-tertiary border-tertiary/30',
  },
  medio: {
    chip: 'bg-primary/10 text-primary border-primary/30',
  },
  baixo: {
    chip: 'bg-muted text-muted-foreground border-outline-variant',
  },
};

export type RiscoBadgeProps = {
  nivel: NivelRisco;
  className?: string;
};

export function RiscoBadge({ nivel, className }: RiscoBadgeProps) {
  const styles = RISCO_STYLES[nivel];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        styles.chip,
        styles.pulse && 'animate-pulse',
        className,
      )}
    >
      {NIVEL_RISCO_LABELS[nivel]}
    </span>
  );
}
