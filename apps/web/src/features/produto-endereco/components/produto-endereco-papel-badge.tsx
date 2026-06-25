'use client';

import { cn } from '@lilog/ui';

import {
  PAPEL_PRODUTO_ENDERECO_LABELS,
  type ProdutoEnderecoPapelForm,
} from '@/features/produto-endereco/types/produto-endereco.schema';

type ProdutoEnderecoPapelBadgeProps = {
  papel: ProdutoEnderecoPapelForm;
  className?: string;
};

const PAPEL_TONE: Record<ProdutoEnderecoPapelForm, string> = {
  picking_primario: 'bg-primary/10 text-primary border-primary/20',
  picking_secundario: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
  pulmao: 'bg-amber-500/10 text-amber-800 border-amber-500/20',
};

export function ProdutoEnderecoPapelBadge({
  papel,
  className,
}: ProdutoEnderecoPapelBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-0.5 text-caption font-medium',
        PAPEL_TONE[papel],
        className,
      )}
    >
      {PAPEL_PRODUTO_ENDERECO_LABELS[papel]}
    </span>
  );
}
