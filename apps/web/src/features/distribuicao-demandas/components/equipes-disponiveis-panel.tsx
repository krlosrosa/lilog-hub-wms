'use client';

import { useDroppable } from '@dnd-kit/core';

import { cn } from '@lilog/ui';

import { OperadorCard } from '@/features/distribuicao-demandas/components/operador-card';
import {
  distribuicaoPanelClassName,
  distribuicaoSectionTitleClassName,
} from '@/features/distribuicao-demandas/components/distribuicao-panel-classes';
import type { Operador } from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

export type EquipesDisponiveisPanelProps = {
  operadores: Operador[];
  operadoresDisponiveisIds: string[];
  className?: string;
};

export function EquipesDisponiveisPanel({
  operadores,
  operadoresDisponiveisIds,
  className,
}: EquipesDisponiveisPanelProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'pool-operadores',
    data: { type: 'pool' },
  });

  const porEmpresa = operadores.reduce<Record<string, Operador[]>>(
    (acc, op) => {
      if (!acc[op.empresa]) acc[op.empresa] = [];
      acc[op.empresa]!.push(op);
      return acc;
    },
    {},
  );

  return (
    <section
      className={cn(
        distribuicaoPanelClassName,
        'flex h-full min-h-[280px] flex-col overflow-hidden',
        className,
      )}
    >
      <header className="border-b border-outline-variant px-4 py-3">
        <h2 className={distribuicaoSectionTitleClassName}>
          B — Equipes disponíveis
        </h2>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-4 overflow-y-auto p-4',
          isOver && 'bg-surface-highest/30',
        )}
      >
        {Object.entries(porEmpresa).map(([empresa, ops]) => (
          <div key={empresa}>
            <p className="mb-2 text-xs font-semibold text-foreground">
              {empresa}
            </p>
            <div className="space-y-1.5">
              {ops.map((op) => {
                const disponivel =
                  operadoresDisponiveisIds.includes(op.id) ||
                  op.funcao === 'conferente';
                return (
                  <OperadorCard
                    key={op.id}
                    operador={op}
                    draggable={disponivel}
                    sourceWorkloadId={null}
                    className={!disponivel ? 'opacity-50' : undefined}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
