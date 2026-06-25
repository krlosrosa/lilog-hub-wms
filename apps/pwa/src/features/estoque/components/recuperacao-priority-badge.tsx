import { cn } from '@lilog/ui';

import type { RecuperacaoPrioridade } from '../types/recuperacao.schema';

const PRIORITY_CONFIG: Record<
  RecuperacaoPrioridade,
  { label: string; className: string }
> = {
  alta: {
    label: 'Alta',
    className: 'bg-error-container text-on-error-container',
  },
  media: {
    label: 'Média',
    className: 'bg-surface-container-highest text-on-surface-variant',
  },
  baixa: {
    label: 'Baixa',
    className: 'bg-surface-container-low text-on-tertiary-container',
  },
};

export function RecuperacaoPriorityBadge({
  prioridade,
  compact = false,
}: {
  prioridade: RecuperacaoPrioridade;
  compact?: boolean;
}) {
  const config = PRIORITY_CONFIG[prioridade];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-full font-bold uppercase',
        compact
          ? 'px-1.5 py-px text-[10px] leading-none tracking-wide'
          : 'px-2.5 py-0.5 text-label-sm tracking-wider',
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
