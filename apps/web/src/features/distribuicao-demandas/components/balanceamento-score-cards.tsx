import { cn } from '@lilog/ui';

import {
  EquilibrioIndicador,
} from '@/features/distribuicao-demandas/components/equilibrio-indicador';
import {
  distribuicaoLabelClassName,
  distribuicaoPanelClassName,
} from '@/features/distribuicao-demandas/components/distribuicao-panel-classes';
import type { Workload } from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

export type BalanceamentoScoreCardsProps = {
  workloads: Workload[];
  scoreMedio: number;
  className?: string;
};

export function BalanceamentoScoreCards({
  workloads,
  scoreMedio,
  className,
}: BalanceamentoScoreCardsProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5',
        className,
      )}
    >
      {workloads.map((w) => (
        <div
          key={w.id}
          className={cn(distribuicaoPanelClassName, 'px-4 py-3')}
        >
          <p className={distribuicaoLabelClassName}>
            Workload {w.indice}
          </p>
          <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
            {w.score}
          </p>
          <div className="mt-2">
            <EquilibrioIndicador
              status={w.statusEquilibrio}
              desvioPercentual={w.desvioPercentual}
            />
          </div>
        </div>
      ))}
      <div className={cn(distribuicaoPanelClassName, 'px-4 py-3')}>
        <p className={distribuicaoLabelClassName}>Média</p>
        <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
          {scoreMedio}
        </p>
      </div>
    </div>
  );
}

export type DesvioWorkloadRow = {
  workloadIndice: number;
  desvioPercentual: number;
  label: string;
};

export function BalanceamentoDesvioTable({
  workloads,
  scoreMedio,
  className,
}: {
  workloads: Workload[];
  scoreMedio: number;
  className?: string;
}) {
  const rows: DesvioWorkloadRow[] = workloads.map((w) => {
    let label = 'Na média';
    if (w.desvioPercentual > 8) {
      label = `+${w.desvioPercentual.toFixed(1)}% acima da média`;
    } else if (w.desvioPercentual < -8) {
      label = `${w.desvioPercentual.toFixed(1)}% abaixo da média`;
    }

    return {
      workloadIndice: w.indice,
      desvioPercentual: w.desvioPercentual,
      label,
    };
  });

  return (
    <section className={cn(distribuicaoPanelClassName, 'overflow-hidden', className)}>
      <header className="border-b border-outline-variant px-4 py-3">
        <h2 className="text-label-md font-semibold">Desvio entre workloads</h2>
        <p className="text-xs text-muted-foreground">
          Score médio de referência: {scoreMedio}
        </p>
      </header>
      <div className="divide-y divide-outline-variant/30">
        {rows.map((row) => (
          <div
            key={row.workloadIndice}
            className="flex items-center justify-between px-4 py-2 text-xs"
          >
            <span className="font-mono">Workload {row.workloadIndice}</span>
            <span className="tabular-nums text-muted-foreground">{row.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
