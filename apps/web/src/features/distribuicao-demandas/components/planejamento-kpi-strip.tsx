import { cn } from '@lilog/ui';

import {
  distribuicaoLabelClassName,
  distribuicaoPanelClassName,
} from '@/features/distribuicao-demandas/components/distribuicao-panel-classes';
import type { ResumoPlanejamento } from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

type KpiItem = {
  label: string;
  value: string;
  sub?: string;
};

export type PlanejamentoKpiStripProps = {
  resumo: ResumoPlanejamento;
  className?: string;
};

export function PlanejamentoKpiStrip({ resumo, className }: PlanejamentoKpiStripProps) {
  const items: KpiItem[] = [
    {
      label: 'Mapas pendentes',
      value: resumo.mapasPendentes.toLocaleString('pt-BR'),
    },
    {
      label: 'Peso pendente',
      value: `${resumo.pesoPendenteKg.toLocaleString('pt-BR')} kg`,
    },
    {
      label: 'Total volumes',
      value: resumo.totalVolumes.toLocaleString('pt-BR'),
      sub: 'caixas',
    },
    {
      label: 'Total carros',
      value: resumo.totalCarros.toLocaleString('pt-BR'),
    },
    {
      label: 'Docas ocupadas',
      value: `${resumo.docasOcupadas}/${resumo.docasTotal}`,
    },
    {
      label: 'Transportes aguardando',
      value: resumo.transportesAguardando.toLocaleString('pt-BR'),
    },
  ];

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6',
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(distribuicaoPanelClassName, 'px-4 py-3')}
        >
          <p className={distribuicaoLabelClassName}>{item.label}</p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">
            {item.value}
          </p>
          {item.sub ? (
            <p className="text-[10px] text-muted-foreground">{item.sub}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
