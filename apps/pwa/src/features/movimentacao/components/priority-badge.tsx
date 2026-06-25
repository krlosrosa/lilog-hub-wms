import { cn } from '@lilog/ui';
import { AlertTriangle, ArrowDown, Zap, type LucideIcon } from 'lucide-react';
import type { HTMLAttributes } from 'react';

import type { Prioridade } from '../types/movimentacao.schema';

const PRIORIDADE_CONFIG: Record<
  Prioridade,
  { label: string; className: string; stripeClass: string; Icon: LucideIcon }
> = {
  alta: {
    label: 'Alta',
    className: 'bg-destructive/10 text-destructive',
    stripeClass: 'bg-destructive',
    Icon: Zap,
  },
  media: {
    label: 'Média',
    className: 'bg-warning-container text-on-warning-container',
    stripeClass: 'bg-warning',
    Icon: AlertTriangle,
  },
  baixa: {
    label: 'Baixa',
    className: 'bg-secondary-container text-on-secondary-container',
    stripeClass: 'bg-secondary',
    Icon: ArrowDown,
  },
};

interface PriorityBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  prioridade: Prioridade;
  showStripe?: boolean;
}

export function PriorityBadge({
  prioridade,
  showStripe = false,
  className,
  ...props
}: PriorityBadgeProps) {
  const config = PRIORIDADE_CONFIG[prioridade];
  const Icon = config.Icon;

  if (showStripe) {
    return (
      <div className={cn('flex items-center gap-3', className)} {...props}>
        <div className={cn('h-10 w-1 shrink-0 rounded-full', config.stripeClass)} aria-hidden />
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-label-sm font-bold uppercase',
            config.className
          )}
        >
          <Icon className="h-3 w-3" aria-hidden />
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase leading-none',
        config.className,
        className
      )}
      {...props}
    >
      <Icon className="h-2.5 w-2.5" aria-hidden />
      {config.label}
    </span>
  );
}
