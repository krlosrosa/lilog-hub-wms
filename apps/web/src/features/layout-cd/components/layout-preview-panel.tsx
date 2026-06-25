'use client';

import { Minus, Plus } from 'lucide-react';
import { useMemo } from 'react';

import { Button, cn } from '@lilog/ui';

import { WarehouseCanvas } from '@/features/layout-cd/components/warehouse-canvas';
import type {
  LayoutHierarchy,
  LayoutSelection,
  WarehousePosition,
} from '@/features/layout-cd/types/layout-cd.schema';
import { hierarchyToWarehouseLayout } from '@/features/layout-cd/utils/hierarchy-to-warehouse-layout';
import {
  countPreviewSlots,
  selectionToPosId,
} from '@/features/layout-cd/utils/layout-preview-utils';
import { streetTypeLabel } from '@/features/layout-cd/utils/layout-hierarchy-ops';

type LayoutPreviewPanelProps = {
  hierarchy: LayoutHierarchy;
  selection: LayoutSelection | null;
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSelectPosition: (position: WarehousePosition) => void;
  className?: string;
};

export function LayoutPreviewPanel({
  hierarchy,
  selection,
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onSelectPosition,
  className,
}: LayoutPreviewPanelProps) {
  const warehouseLayout = useMemo(
    () => hierarchyToWarehouseLayout(hierarchy),
    [hierarchy],
  );

  const selectedPosId = useMemo(
    () => selectionToPosId(warehouseLayout, selection),
    [warehouseLayout, selection],
  );

  const slotCount = countPreviewSlots(warehouseLayout);
  const trafficStreets = hierarchy.streets.filter(
    (s) => s.type === 'corredor-trafego',
  );

  const hasMapContent =
    warehouseLayout.aisles.length > 0 ||
    (warehouseLayout.transversalBands?.length ?? 0) > 0 ||
    warehouseLayout.driveInLanes.length > 0;

  return (
    <section
      className={cn('flex min-h-0 min-w-0 flex-1 flex-col bg-background', className)}
    >
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-outline-variant bg-card px-4 py-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            Pré-visualização do armazém
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">
            Atualiza conforme a hierarquia · {slotCount} posições no mapa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={onZoomOut}>
            <Minus className="h-4 w-4" />
          </Button>
          <span className="min-w-[3rem] text-center font-mono text-xs">{zoomPercent}%</span>
          <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={onZoomIn}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {hasMapContent ? (
          <WarehouseCanvas
            aisles={warehouseLayout.aisles}
            transversalBands={warehouseLayout.transversalBands}
            driveInLanes={warehouseLayout.driveInLanes}
            selectedPosId={selectedPosId}
            onSelectPosition={onSelectPosition}
            zoomPercent={zoomPercent}
            className="absolute inset-0"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-8">
            <p className="max-w-md text-center text-sm text-muted-foreground">
              Monte o layout na hierarquia à esquerda: adicione um corredor, estruturas e
              posições. O mapa do armazém aparece aqui em tempo real.
            </p>
          </div>
        )}

        {trafficStreets.length > 0 ? (
          <div className="pointer-events-none absolute bottom-4 left-4 right-4 rounded-lg border border-outline-variant bg-card/90 px-3 py-2 backdrop-blur-sm">
            <p className="font-mono text-[10px] text-muted-foreground">
              Corredores de tráfego (não entram no grid):{' '}
              {trafficStreets
                .map((s) => `${s.code} — ${streetTypeLabel(s.type)}`)
                .join(' · ')}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
