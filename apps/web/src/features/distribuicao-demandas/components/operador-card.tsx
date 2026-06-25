'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import { cn } from '@lilog/ui';

import { distribuicaoLabelClassName } from '@/features/distribuicao-demandas/components/distribuicao-panel-classes';
import type { Operador } from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

export type OperadorCardProps = {
  operador: Operador;
  draggable?: boolean;
  sourceWorkloadId?: string | null;
  className?: string;
};

export function OperadorCard({
  operador,
  draggable = true,
  sourceWorkloadId = null,
  className,
}: OperadorCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `operador-${operador.id}`,
      data: {
        type: 'operador',
        operadorId: operador.id,
        sourceWorkloadId,
      },
      disabled: !draggable,
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(draggable ? { ...listeners, ...attributes } : {})}
      className={cn(
        'rounded border border-outline-variant bg-surface-low px-2 py-1.5',
        draggable && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 ring-2 ring-ring',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium">{operador.nome}</span>
        <span className="text-[10px] uppercase text-muted-foreground">
          {operador.funcao}
        </span>
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground">{operador.cargo}</div>
      <div className="mt-1 grid grid-cols-2 gap-x-2 text-[10px] tabular-nums text-muted-foreground">
        <span>Cap: {operador.capacidadeKgH} kg/h</span>
        <span>Prod: {operador.produtividadeMedia}%</span>
      </div>
      <div className="mt-1.5">
        <div className="flex justify-between text-[10px]">
          <span className={distribuicaoLabelClassName}>Carga</span>
          <span className="tabular-nums">{operador.cargaAtualPercent}%</span>
        </div>
        <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-foreground/40"
            style={{ width: `${operador.cargaAtualPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
