'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Truck } from 'lucide-react';

import { cn } from '@lilog/ui';

import type { TransporteExpedicao } from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

export type TransporteChipProps = {
  transporte: TransporteExpedicao;
  sourceWorkloadId?: string | null;
  draggable?: boolean;
  className?: string;
};

export function TransporteChip({
  transporte,
  sourceWorkloadId = null,
  draggable = true,
  className,
}: TransporteChipProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `transporte-${transporte.id}`,
      data: {
        type: 'transporte',
        transporteId: transporte.id,
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
        'rounded border border-outline-variant bg-surface-high px-2 py-1.5',
        draggable && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 ring-2 ring-ring',
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <Truck className="size-3 shrink-0 text-muted-foreground" aria-hidden />
        <p className="font-mono text-[10px] font-semibold">{transporte.codigo}</p>
      </div>
      <p className="text-[10px] text-muted-foreground">
        {transporte.totalMapas} mapas · {transporte.totalPaletes} pl ·{' '}
        {transporte.caixas} cx · {transporte.pesoTotalKg.toLocaleString('pt-BR')} kg
      </p>
      <p className="font-mono text-[9px] text-muted-foreground">{transporte.placa}</p>
    </div>
  );
}
