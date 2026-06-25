'use client';

import { cn } from '@lilog/ui';

import {
  PAUSA_TIPO_LABELS,
  type PausaTipo,
} from '@/features/pausas/types/pausas.schema';

const VARIANT_CLASSES: Record<PausaTipo, string> = {
  termica: 'bg-tertiary-container/20 text-tertiary border-tertiary/30',
  refeicao: 'bg-secondary-container text-secondary-on-container border-secondary/30',
  outros: 'bg-muted text-muted-foreground border-outline-variant',
};

export type PausaTipoBadgeProps = {
  tipo: PausaTipo;
  compact?: boolean;
  className?: string;
};

export function PausaTipoBadge({
  tipo,
  compact = false,
  className,
}: PausaTipoBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded border font-medium',
        compact
          ? 'px-1.5 py-0 text-[9px]'
          : 'rounded-md px-2 py-0.5 text-caption',
        VARIANT_CLASSES[tipo],
        className,
      )}
    >
      {PAUSA_TIPO_LABELS[tipo]}
    </span>
  );
}
