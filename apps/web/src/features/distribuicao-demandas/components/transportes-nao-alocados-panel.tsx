'use client';

import { useDroppable } from '@dnd-kit/core';

import { cn } from '@lilog/ui';

import { TransporteChip } from '@/features/distribuicao-demandas/components/transporte-chip';
import {
  distribuicaoLabelClassName,
  distribuicaoPanelClassName,
  distribuicaoSectionTitleClassName,
} from '@/features/distribuicao-demandas/components/distribuicao-panel-classes';
import type { TransporteExpedicao } from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

export type TransportesNaoAlocadosPanelProps = {
  transportes: TransporteExpedicao[];
  transportesNaoAlocadosIds: string[];
  className?: string;
};

export function TransportesNaoAlocadosPanel({
  transportes,
  transportesNaoAlocadosIds,
  className,
}: TransportesNaoAlocadosPanelProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'pool-transportes',
    data: { type: 'pool-transportes' },
  });

  const naoAlocados = transportes.filter((t) =>
    transportesNaoAlocadosIds.includes(t.id),
  );

  return (
    <section
      className={cn(
        distribuicaoPanelClassName,
        'overflow-hidden',
        className,
      )}
    >
      <header className="border-b border-outline-variant px-4 py-2">
        <h3 className={distribuicaoSectionTitleClassName}>
          Pool de transportes
        </h3>
        <p className="text-[10px] text-muted-foreground">
          Arraste transportes inteiros entre workloads ou solte aqui para
          desalocar — mapas e pedidos permanecem agrupados
        </p>
      </header>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[56px] flex-wrap gap-2 p-4',
          isOver && 'bg-surface-highest/30',
          naoAlocados.length === 0 && 'items-center justify-center',
        )}
      >
        {naoAlocados.length > 0 ? (
          naoAlocados.map((transporte) => (
            <TransporteChip
              key={transporte.id}
              transporte={transporte}
              sourceWorkloadId={null}
            />
          ))
        ) : (
          <p className={distribuicaoLabelClassName}>
            Todos os transportes alocados — solte aqui para remover de um workload
          </p>
        )}
      </div>
    </section>
  );
}
