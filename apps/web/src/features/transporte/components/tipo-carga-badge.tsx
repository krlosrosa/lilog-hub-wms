'use client';

import { cn } from '@lilog/ui';
import { Package, Snowflake } from 'lucide-react';

import type { TipoCarga } from '@/features/transporte/types/transporte.schema';
import { TIPO_CARGA_LABELS } from '@/features/transporte/types/transporte.schema';

type TipoCargaBadgeProps = {
  tipoCarga: TipoCarga;
  className?: string;
};

export function TipoCargaBadge({ tipoCarga, className }: TipoCargaBadgeProps) {
  const refrigerado = tipoCarga === 'refrigerado';
  const Icon = refrigerado ? Snowflake : Package;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset',
        refrigerado
          ? 'bg-secondary/15 text-secondary ring-secondary/25'
          : 'bg-tertiary/15 text-tertiary ring-tertiary/25',
        className,
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      {TIPO_CARGA_LABELS[tipoCarga]}
    </span>
  );
}
