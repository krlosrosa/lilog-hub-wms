'use client';

import { cn } from '@lilog/ui';

import {
  EquilibrioScoreGlobal,
} from '@/features/distribuicao-demandas/components/equilibrio-indicador';
import { TransportesNaoAlocadosPanel } from '@/features/distribuicao-demandas/components/transportes-nao-alocados-panel';
import { WorkloadCard } from '@/features/distribuicao-demandas/components/workload-card';
import {
  distribuicaoPanelClassName,
  distribuicaoSectionTitleClassName,
} from '@/features/distribuicao-demandas/components/distribuicao-panel-classes';
import type {
  BalanceamentoResumo,
  Doca,
  Operador,
  TransporteExpedicao,
  Workload,
} from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

export type SimulacaoWorkloadsPanelProps = {
  workloads: Workload[];
  docas: Doca[];
  operadores: Operador[];
  transportes: TransporteExpedicao[];
  transportesNaoAlocadosIds: string[];
  balanceamento: BalanceamentoResumo;
  workloadPreviewId: string | null;
  onSelectWorkload: (workloadId: string) => void;
  className?: string;
};

export function SimulacaoWorkloadsPanel({
  workloads,
  docas,
  operadores,
  transportes,
  transportesNaoAlocadosIds,
  balanceamento,
  workloadPreviewId,
  onSelectWorkload,
  className,
}: SimulacaoWorkloadsPanelProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <TransportesNaoAlocadosPanel
        transportes={transportes}
        transportesNaoAlocadosIds={transportesNaoAlocadosIds}
      />

      <section
        className={cn(
          distribuicaoPanelClassName,
          'flex flex-col overflow-hidden',
        )}
      >
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-5 py-4">
          <div>
            <h2 className={distribuicaoSectionTitleClassName}>
              C — Simulação de distribuição
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Arraste transportes entre workloads · clique no card para ver o resumo
            </p>
          </div>
          <EquilibrioScoreGlobal score={balanceamento.scoreGlobalEquilibrio} />
        </header>

        <div className="overflow-y-auto p-5">
          {workloads.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Configure docas e funcionários, depois clique em Simular.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {workloads.map((workload) => (
                <WorkloadCard
                  key={workload.id}
                  workload={workload}
                  doca={docas.find((d) => d.id === workload.docaId)}
                  operadores={operadores}
                  transportes={transportes}
                  totalWorkloads={workloads.length}
                  onSelect={() => onSelectWorkload(workload.id)}
                  isSelected={workloadPreviewId === workload.id}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
