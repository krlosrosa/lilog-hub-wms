'use client';

import { cn } from '@lilog/ui';

import {
  TIPOS_PAUSA_REGRA,
  type TipoPausaRegra,
} from '@/features/regras-pausas/types/tipo-pausa-regra-tabs';
import {
  segmentGroupClassName,
  segmentButtonClassName,
} from '@/components/ui/panel-styles';

type RegrasPausasTabsProps = {
  abaAtiva: TipoPausaRegra;
  onChange: (aba: TipoPausaRegra) => void;
  className?: string;
};

export function RegrasPausasTabs({
  abaAtiva,
  onChange,
  className,
}: RegrasPausasTabsProps) {
  return (
    <div className={cn(segmentGroupClassName, className)} role="tablist" aria-label="Tipo de pausa">
      {TIPOS_PAUSA_REGRA.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={abaAtiva === id}
          onClick={() => onChange(id)}
          className={segmentButtonClassName(abaAtiva === id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
