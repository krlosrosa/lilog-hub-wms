import { cn } from '@lilog/ui';

import {
  CATEGORIA_LABELS,
  normalizeProdutoCategoria,
  type ProdutoCategoria,
} from '@/features/produto/types/produto-lista.schema';

const BADGE_VARIANTS: Record<
  ProdutoCategoria,
  { className: string }
> = {
  seco: {
    className:
      'border border-secondary-container/30 bg-secondary-container/20 text-secondary-foreground',
  },
  refrigerado: {
    className: 'border border-tertiary/20 bg-tertiary/10 text-tertiary',
  },
  queijo: {
    className:
      'border border-primary/20 bg-primary-container/20 text-primary',
  },
};

export type ProdutoCategoriaBadgeProps = {
  categoria: ProdutoCategoria;
  compact?: boolean;
  className?: string;
};

export function ProdutoCategoriaBadge({
  categoria,
  compact = false,
  className,
}: ProdutoCategoriaBadgeProps) {
  const normalized = normalizeProdutoCategoria(categoria);
  const v = BADGE_VARIANTS[normalized];

  return (
    <span
      className={cn(
        'rounded border font-medium',
        compact ? 'px-1.5 py-0 text-[9px]' : 'px-2 py-1 text-caption',
        v.className,
        className,
      )}
    >
      {CATEGORIA_LABELS[normalized]}
    </span>
  );
}
