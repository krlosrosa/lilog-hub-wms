import { cn } from '@lilog/ui';

import {
  distribuicaoLabelClassName,
  distribuicaoPanelClassName,
} from '@/features/distribuicao-demandas/components/distribuicao-panel-classes';
import type {
  Doca,
  Workload,
} from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

type BarChartProps = {
  title: string;
  subtitle?: string;
  items: { label: string; value: number }[];
  unit?: string;
  className?: string;
};

function BarChart({ title, subtitle, items, unit = '', className }: BarChartProps) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className={cn(distribuicaoPanelClassName, 'flex flex-col gap-4 p-4', className)}>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle ? (
          <p className="text-caption text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex h-48 items-end justify-between gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1"
          >
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {item.value.toLocaleString('pt-BR')}
              {unit}
            </span>
            <div
              className="w-full max-w-10 rounded-t-sm bg-foreground/30 transition-opacity hover:opacity-80"
              style={{ height: `${(item.value / max) * 100}%`, minHeight: 4 }}
            />
            <span className="text-[10px] text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export type BalanceamentoChartsProps = {
  workloads: Workload[];
  docas: Doca[];
  className?: string;
};

export function BalanceamentoCharts({
  workloads,
  docas,
  className,
}: BalanceamentoChartsProps) {
  const pesoItems = workloads.map((w) => ({
    label: `WL${w.indice}`,
    value: w.metricas.pesoKg,
  }));

  const caixasItems = workloads.map((w) => ({
    label: `WL${w.indice}`,
    value: w.metricas.caixas,
  }));

  const transportesItems = workloads.map((w) => ({
    label: `WL${w.indice}`,
    value: w.metricas.transportes,
  }));

  const mapasItems = workloads.map((w) => ({
    label: `WL${w.indice}`,
    value: w.metricas.mapas,
  }));

  const docasUsadas = workloads.reduce<Record<string, number>>((acc, w) => {
    acc[w.docaId] = (acc[w.docaId] ?? 0) + 1;
    return acc;
  }, {});

  const docaItems = Object.entries(docasUsadas).map(([docaId, count]) => {
    const doca = docas.find((d) => d.id === docaId);
    return { label: doca?.codigo ?? docaId, value: count };
  });

  return (
    <div className={cn('grid grid-cols-1 gap-gutter md:grid-cols-2', className)}>
      <BarChart
        title="Distribuição de peso"
        subtitle="Por workload (kg)"
        items={pesoItems}
        unit=" kg"
      />
      <BarChart
        title="Distribuição de caixas"
        subtitle="Por workload"
        items={caixasItems}
      />
      <BarChart
        title="Distribuição de transportes"
        subtitle="Transportes inteiros por workload"
        items={transportesItems}
      />
      <BarChart
        title="Distribuição de mapas"
        subtitle="Mapas agrupados por transporte"
        items={mapasItems}
      />
      <BarChart
        title="Ocupação por doca"
        subtitle="Workloads alocados"
        items={docaItems.length > 0 ? docaItems : [{ label: '—', value: 0 }]}
      />
    </div>
  );
}

export { distribuicaoLabelClassName };
