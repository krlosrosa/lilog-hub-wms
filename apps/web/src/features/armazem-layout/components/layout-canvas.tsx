'use client';

import { useCallback, useRef, useState } from 'react';

import { cn } from '@lilog/ui';

import { EmptyState } from '@/features/armazem-layout/components/empty-state';
import { LayoutElementBlock } from '@/features/armazem-layout/components/layout-element-block';
import {
  CELL_SIZE_PX,
  GRID_MARGIN_PX,
  glassPanelClassName,
} from '@/features/armazem-layout/constants';
import type { ArmazemLayoutSlotOcupacaoApi } from '@/features/armazem-layout/api';
import type { BuilderTool, LayoutElement, WarehouseLayout } from '@/features/armazem-layout/types';
import {
  gridToPixel,
  layoutPixelSize,
  pixelToGrid,
} from '@/features/armazem-layout/utils/grid';

type LayoutCanvasProps = {
  layout: WarehouseLayout;
  tool: BuilderTool;
  selectedId: string | null;
  zoomPercent: number;
  viewMode: 'editar' | 'ocupacao';
  ocupacaoSlots?: ArmazemLayoutSlotOcupacaoApi[];
  onPlaceAt: (gx: number, gy: number) => void;
  onMoveElement: (id: string, gx: number, gy: number) => void;
  onSelectElement: (id: string | null) => void;
  className?: string;
};

export function LayoutCanvas({
  layout,
  tool,
  selectedId,
  zoomPercent,
  viewMode,
  ocupacaoSlots = [],
  onPlaceAt,
  onMoveElement,
  onSelectElement,
  className,
}: LayoutCanvasProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    id: string;
    offsetGx: number;
    offsetGy: number;
  } | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    id: string;
    gx: number;
    gy: number;
  } | null>(null);

  const canvasSize = layoutPixelSize(
    layout.gridCols,
    layout.gridRows,
    CELL_SIZE_PX,
    GRID_MARGIN_PX,
  );

  const scale = zoomPercent / 100;

  const getGridCoordsFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const area = contentRef.current;
      if (!area) return null;

      const rect = area.getBoundingClientRect();
      const px = (clientX - rect.left) / scale;
      const py = (clientY - rect.top) / scale;
      return pixelToGrid(px, py, CELL_SIZE_PX, GRID_MARGIN_PX);
    },
    [scale],
  );

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest('[data-layout-element]')) return;

      const coords = getGridCoordsFromClient(event.clientX, event.clientY);
      if (!coords) return;

      if (tool === 'selecionar' || viewMode === 'ocupacao') {
        if (tool === 'selecionar') onSelectElement(null);
        return;
      }

      onPlaceAt(coords.gx, coords.gy);
    },
    [getGridCoordsFromClient, onPlaceAt, onSelectElement, tool, viewMode],
  );

  const handleElementMouseDown = useCallback(
    (event: React.MouseEvent, element: LayoutElement) => {
      if (tool !== 'selecionar' || viewMode === 'ocupacao') return;

      event.stopPropagation();
      onSelectElement(element.id);

      const coords = getGridCoordsFromClient(event.clientX, event.clientY);
      if (!coords) return;

      dragRef.current = {
        id: element.id,
        offsetGx: coords.gx - element.gx,
        offsetGy: coords.gy - element.gy,
      };
      setDragPreview({ id: element.id, gx: element.gx, gy: element.gy });

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragRef.current) return;
        const nextCoords = getGridCoordsFromClient(moveEvent.clientX, moveEvent.clientY);
        if (!nextCoords) return;

        setDragPreview({
          id: dragRef.current.id,
          gx: nextCoords.gx - dragRef.current.offsetGx,
          gy: nextCoords.gy - dragRef.current.offsetGy,
        });
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        if (dragRef.current) {
          const nextCoords = getGridCoordsFromClient(upEvent.clientX, upEvent.clientY);
          if (nextCoords) {
            onMoveElement(
              dragRef.current.id,
              nextCoords.gx - dragRef.current.offsetGx,
              nextCoords.gy - dragRef.current.offsetGy,
            );
          }
        }

        dragRef.current = null;
        setDragPreview(null);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [getGridCoordsFromClient, onMoveElement, onSelectElement, tool, viewMode],
  );

  const renderElement = (element: LayoutElement) => {
    const preview =
      dragPreview?.id === element.id ? dragPreview : { gx: element.gx, gy: element.gy };
    const pixel = gridToPixel(
      preview.gx,
      preview.gy,
      element.gw,
      element.gh,
      CELL_SIZE_PX,
      GRID_MARGIN_PX,
    );

    return (
      <LayoutElementBlock
        key={element.id}
        element={element}
        selected={selectedId === element.id}
        viewMode={viewMode}
        ocupacaoSlots={ocupacaoSlots}
        style={{
          left: pixel.x,
          top: pixel.y,
          width: pixel.w,
          height: pixel.h,
        }}
        onSelect={() => onSelectElement(element.id)}
        onMouseDown={(event) => handleElementMouseDown(event, element)}
      />
    );
  };

  return (
    <div
      className={cn(
        'relative min-h-0 flex-1 overflow-auto blueprint-grid',
        tool === 'selecionar' ? 'cursor-default' : 'cursor-crosshair',
        viewMode === 'ocupacao' && 'cursor-default',
        className,
      )}
    >
      <div className="absolute inset-0 blueprint-grid-minor opacity-30" />

      <div className="custom-scrollbar relative min-h-full overflow-auto p-6">
        <div
          ref={contentRef}
          onClick={handleCanvasClick}
          className="relative rounded-xl border-2 border-outline-variant bg-surface-lowest shadow-2xl"
          style={{
            width: canvasSize.width * scale,
            height: canvasSize.height * scale,
          }}
        >
          <div
            className="relative origin-top-left"
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
              transform: `scale(${scale})`,
            }}
          >
            {Array.from({ length: layout.gridCols + 1 }).map((_, index) => (
              <div
                key={`v-${index}`}
                className="pointer-events-none absolute top-0 bottom-0 w-px bg-outline-variant/20"
                style={{ left: GRID_MARGIN_PX + index * CELL_SIZE_PX }}
              />
            ))}
            {Array.from({ length: layout.gridRows + 1 }).map((_, index) => (
              <div
                key={`h-${index}`}
                className="pointer-events-none absolute right-0 left-0 h-px bg-outline-variant/20"
                style={{ top: GRID_MARGIN_PX + index * CELL_SIZE_PX }}
              />
            ))}

            {layout.elements.map(renderElement)}

            {layout.elements.length === 0 ? <EmptyState /> : null}
          </div>
        </div>
      </div>

      <div
        className={cn(
          glassPanelClassName,
          'pointer-events-none absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4 px-4 py-2',
        )}
      >
        <span className="font-mono text-[10px] text-muted-foreground">
          Grade {layout.gridCols}×{layout.gridRows}
        </span>
        <span className="h-4 w-px bg-outline-variant" />
        <span className="font-mono text-[10px] text-muted-foreground">
          {layout.elements.length} elementos
        </span>
        <span className="h-4 w-px bg-outline-variant" />
        <span className="font-mono text-[10px] text-muted-foreground">
          {tool === 'selecionar' ? 'Clique para selecionar · Arraste para mover' : 'Clique na grade para posicionar'}
          {viewMode === 'ocupacao' ? ' · Modo ocupação' : ''}
        </span>
      </div>
    </div>
  );
}
