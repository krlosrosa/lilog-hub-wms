'use client';

import { useDroppable } from '@dnd-kit/core';

import { cn } from '@lilog/ui';

import { EquilibrioIndicador } from '@/features/distribuicao-demandas/components/equilibrio-indicador';
import { TransporteChip } from '@/features/distribuicao-demandas/components/transporte-chip';
import { distribuicaoLabelClassName } from '@/features/distribuicao-demandas/components/distribuicao-panel-classes';
import type {
  Doca,
  Operador,
  TransporteExpedicao,
  Workload,
} from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

export type WorkloadCardProps = {
  workload: Workload;
  doca: Doca | undefined;
  operadores: Operador[];
  transportes: TransporteExpedicao[];
  totalWorkloads: number;
  onSelect: () => void;
  isSelected?: boolean;
  className?: string;
};

export function WorkloadCard({
  workload,
  doca,
  operadores,
  transportes,
  totalWorkloads,
  onSelect,
  isSelected,
  className,
}: WorkloadCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `workload-${workload.id}`,
    data: { type: 'workload', workloadId: workload.id },
  });

  const transportesAlocados = transportes.filter((t) =>
    workload.transporteIds.includes(t.id),
  );

  const separadores = operadores.filter((o) =>
    workload.separadorIds.includes(o.id),
  );
  const conferentes = operadores.filter((o) =>
    workload.conferenteIds.includes(o.id),
  );

  return (
    <div
      ref={setNodeRef}
      onClick={onSelect}
      className={cn(
        'cursor-pointer rounded-xl border bg-surface-low p-4 transition-all',
        isOver && 'border-dashed border-ring bg-surface-highest/50',
        isSelected
          ? 'border-primary ring-2 ring-primary/30'
          : 'border-outline-variant hover:border-outline-variant/80 hover:bg-surface-high/30',
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-semibold">
            Doca {doca?.codigo ?? '—'}
          </p>
          <p className="text-xs text-muted-foreground">
            Workload {workload.indice}/{totalWorkloads}
          </p>
        </div>
        <EquilibrioIndicador
          status={workload.statusEquilibrio}
          desvioPercentual={workload.desvioPercentual}
        />
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2 text-xs tabular-nums">
        <div className="rounded-md bg-surface-high/40 px-2 py-1.5">
          <p className={distribuicaoLabelClassName}>Transp.</p>
          <p className="font-medium">{workload.metricas.transportes}</p>
        </div>
        <div className="rounded-md bg-surface-high/40 px-2 py-1.5">
          <p className={distribuicaoLabelClassName}>Peso</p>
          <p className="font-medium">
            {(workload.metricas.pesoKg / 1000).toFixed(1)}t
          </p>
        </div>
        <div className="rounded-md bg-surface-high/40 px-2 py-1.5">
          <p className={distribuicaoLabelClassName}>Mapas</p>
          <p className="font-medium">{workload.metricas.mapas}</p>
        </div>
      </div>

      <p className="mb-2 text-xs text-muted-foreground">
        {separadores.length} sep. · {conferentes.length} conf.
      </p>

      <div className="space-y-1.5">
        <p className={distribuicaoLabelClassName}>Transportes</p>
        <div
          className="flex flex-wrap gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {transportesAlocados.map((transporte) => (
            <TransporteChip
              key={transporte.id}
              transporte={transporte}
              sourceWorkloadId={workload.id}
            />
          ))}
          {transportesAlocados.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Solte transportes aqui
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
