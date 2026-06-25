'use client';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useState } from 'react';

import { CapacidadeOperacionalPanel } from '@/features/distribuicao-demandas/components/capacidade-operacional-panel';
import { ConfigOperacionalPanel } from '@/features/distribuicao-demandas/components/config-operacional-panel';
import { SimulacaoWorkloadsPanel } from '@/features/distribuicao-demandas/components/simulacao-workloads-panel';
import { TransporteChip } from '@/features/distribuicao-demandas/components/transporte-chip';
import { WorkloadResumoPanel } from '@/features/distribuicao-demandas/components/workload-resumo-panel';
import type { EstadoDistribuicao } from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

type DragData = {
  type: 'transporte';
  transporteId?: string;
  sourceWorkloadId?: string | null;
};

export type DistribuicaoWorkspaceGridProps = {
  state: EstadoDistribuicao;
  onConfigChange: (patch: Partial<EstadoDistribuicao['config']>) => void;
  onMoverTransporte: (
    transporteId: string,
    deWorkloadId: string | null,
    paraWorkloadId: string | null,
  ) => void;
  onSelectWorkload: (workloadId: string) => void;
};

export function DistribuicaoWorkspaceGrid({
  state,
  onConfigChange,
  onMoverTransporte,
  onSelectWorkload,
}: DistribuicaoWorkspaceGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const [activeDrag, setActiveDrag] = useState<{
    type: 'transporte';
    id: string;
    sourceWorkloadId?: string | null;
  } | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined;
    if (!data?.transporteId) return;

    setActiveDrag({
      type: 'transporte',
      id: data.transporteId,
      sourceWorkloadId: data.sourceWorkloadId,
    });
  };

  const resolverWorkloadDestino = (overId: string): string | null => {
    const match = overId.match(/^workload-(.+)$/);
    return match ? match[1]! : null;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const dragData = active.data.current as DragData | undefined;
    const overId = String(over.id);

    if (dragData?.type === 'transporte' && dragData.transporteId) {
      if (overId === 'pool-transportes') {
        onMoverTransporte(
          dragData.transporteId,
          dragData.sourceWorkloadId ?? null,
          null,
        );
        return;
      }

      const paraWorkloadId = resolverWorkloadDestino(overId);
      if (paraWorkloadId) {
        onMoverTransporte(
          dragData.transporteId,
          dragData.sourceWorkloadId ?? null,
          paraWorkloadId,
        );
      }
    }
  };

  const activeTransporte = activeDrag
    ? state.transportes.find((t) => t.id === activeDrag.id)
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ConfigOperacionalPanel
            config={state.config}
            docas={state.docas}
            onChange={onConfigChange}
            className="min-h-[320px]"
          />
          <CapacidadeOperacionalPanel
            config={state.config}
            className="min-h-[320px]"
          />
        </div>

        <SimulacaoWorkloadsPanel
          workloads={state.workloads}
          docas={state.docas}
          operadores={state.operadores}
          transportes={state.transportes}
          transportesNaoAlocadosIds={state.transportesNaoAlocadosIds}
          balanceamento={state.balanceamento}
          workloadPreviewId={state.workloadPreviewId}
          onSelectWorkload={onSelectWorkload}
        />

        <WorkloadResumoPanel
          transportes={state.transportes}
          workloads={state.workloads}
          docas={state.docas}
          operadores={state.operadores}
          workloadPreviewId={state.workloadPreviewId}
          onSelectWorkload={onSelectWorkload}
          className="min-h-[360px]"
        />
      </div>

      <DragOverlay>
        {activeTransporte ? (
          <TransporteChip transporte={activeTransporte} draggable={false} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
