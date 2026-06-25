'use client';

import { cn } from '@lilog/ui';

import {
  ETAPAS_PRODUTIVIDADE,
  type EtapaProdutividade,
} from '@/features/config-operacional/types/regra-produtividade-tabs';
import {
  segmentGroupClassName,
  segmentButtonClassName,
} from '@/features/expedicao-impressao-config/components/panel-styles';

type RegrasProdutividadeTabsProps = {
  abaAtiva: EtapaProdutividade;
  onChange: (aba: EtapaProdutividade) => void;
  className?: string;
};

export function RegrasProdutividadeTabs({
  abaAtiva,
  onChange,
  className,
}: RegrasProdutividadeTabsProps) {
  return (
    <div className={cn(segmentGroupClassName, className)} role="tablist" aria-label="Etapa">
      {ETAPAS_PRODUTIVIDADE.map(({ id, label }) => (
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
