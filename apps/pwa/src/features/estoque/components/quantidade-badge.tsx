import { cn } from '@lilog/ui';
import type { ReactNode } from 'react';

type QuantidadeBadgeVariant =
  | 'default'
  | 'critico'
  | 'aereo'
  | 'destaque'
  | 'accent'
  | 'muted'
  | 'count';

type QuantidadeBadgeSize = 'sm' | 'md' | 'count';

interface QuantidadeBadgeProps {
  value: number;
  unidade?: string;
  variant?: QuantidadeBadgeVariant;
  size?: QuantidadeBadgeSize;
  className?: string;
}

const VARIANT_STYLES: Record<QuantidadeBadgeVariant, string> = {
  default:
    'border-secondary/20 bg-surface-container-high text-on-surface shadow-sm ring-1 ring-inset ring-secondary/10',
  critico:
    'border-destructive/30 bg-destructive/[0.08] text-destructive shadow-sm ring-1 ring-inset ring-destructive/15',
  aereo:
    'border-tertiary/25 bg-tertiary/[0.06] text-on-surface shadow-sm ring-1 ring-inset ring-tertiary/10',
  destaque:
    'border-on-primary-container/15 bg-on-primary-container/12 text-on-primary-container shadow-none ring-1 ring-inset ring-on-primary-container/10',
  accent:
    'border-on-secondary-container/30 bg-on-secondary-container/25 text-on-secondary-container shadow-sm ring-1 ring-inset ring-on-secondary-container/15',
  muted:
    'border-outline-variant/50 bg-surface-container text-on-surface-variant shadow-none ring-0',
  count:
    'border-transparent bg-on-secondary/15 text-on-secondary ring-0 min-w-[1.35rem]',
};

const INACTIVE_COUNT =
  'border-transparent bg-outline-variant/35 text-on-surface-variant ring-0 min-w-[1.35rem]';

interface CountBadgeProps {
  count: number;
  active?: boolean;
  className?: string;
}

/** Badge circular para contadores (filtros, seções). */
export function CountBadge({ count, active = false, className }: CountBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-[1.35rem] items-center justify-center rounded-full px-1',
        'font-mono text-[10px] font-bold leading-none tabular-nums',
        active ? VARIANT_STYLES.count : INACTIVE_COUNT,
        className,
      )}
    >
      {count}
    </span>
  );
}

/** Quantidade com hierarquia visual (valor + unidade opcional). */
export function QuantidadeBadge({
  value,
  unidade,
  variant = 'default',
  size = 'sm',
  className,
}: QuantidadeBadgeProps) {
  if (size === 'count') {
    return <CountBadge count={value} className={className} />;
  }

  const isMd = size === 'md';

  return (
    <span
      className={cn(
        'inline-flex shrink-0 flex-col items-center justify-center border',
        isMd ? 'min-w-[3.25rem] rounded-xl px-2.5 py-1.5' : 'min-w-[2.75rem] rounded-lg px-2 py-1',
        VARIANT_STYLES[variant],
        className,
      )}
    >
      <span
        className={cn(
          'font-mono font-bold leading-none tabular-nums tracking-tight',
          isMd ? 'text-headline-md' : 'text-label-md',
          variant === 'destaque' && 'text-on-primary-container',
          variant === 'accent' && 'text-on-secondary-container',
        )}
      >
        {value}
      </span>
      {unidade ? (
        <span
          className={cn(
            'mt-0.5 font-medium uppercase leading-none tracking-wider',
            isMd ? 'text-[9px]' : 'text-[8px]',
            variant === 'destaque'
              ? 'text-on-primary-container/55'
              : 'text-on-surface-variant',
            variant === 'critico' && 'text-destructive/70',
          )}
        >
          {unidade}
        </span>
      ) : null}
    </span>
  );
}

interface EstoqueStatItemProps {
  label: string;
  value: number;
  unidade?: string;
  variant?: QuantidadeBadgeVariant;
  icon?: ReactNode;
}

/** Métrica do card resumo (Total / Reservado / Disponível). */
export function EstoqueStatItem({
  label,
  value,
  unidade,
  variant = 'destaque',
  icon,
}: EstoqueStatItemProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
      <span className="flex items-center gap-0.5 text-[9px] font-medium uppercase tracking-wide text-on-primary-container/55">
        {icon}
        {label}
      </span>
      <QuantidadeBadge value={value} unidade={unidade} variant={variant} size="md" />
    </div>
  );
}
