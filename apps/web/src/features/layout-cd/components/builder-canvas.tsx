'use client';

import {
  Columns3,
  Fence,
  Footprints,
  Forklift,
  Package,
  Rows3,
} from 'lucide-react';
import type { ComponentType, RefObject } from 'react';
import { useCallback, useRef, useState } from 'react';

import { cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/layout-cd/components/layout-cd-panel-classes';
import type {
  BuilderTool,
  LayoutComponent,
  LayoutHierarchy,
  LayoutSelection,
  LayoutStreet,
  LayoutStructure,
  RackType,
} from '@/features/layout-cd/types/layout-cd.schema';
import { getCanvasCoords } from '@/features/layout-cd/utils/builder-grid';
import { getComponentDisplayLabel } from '@/features/layout-cd/utils/normalize-component-form';

const TYPE_ICONS: Record<RackType, ComponentType<{ className?: string }>> = {
  'porta-palete': Package,
  'drive-in': Columns3,
  'flow-rack': Rows3,
  'pedestrian-path': Footprints,
  'forklift-street': Forklift,
  'safety-barrier': Fence,
};

type BuilderCanvasProps = {
  canvasRef: RefObject<HTMLElement | null>;
  hierarchy: LayoutHierarchy;
  selection: LayoutSelection | null;
  pendingPartType: RackType | null;
  activeTool: BuilderTool;
  zoomPercent: number;
  gridSizeMm: number;
  cursorX: number;
  cursorY: number;
  onCanvasPlace: (x: number, y: number) => void;
  onSelectNode: (sel: LayoutSelection) => void;
  onMoveStructure: (streetId: string, structureId: string, x: number, y: number) => void;
  onCanvasDeselect: () => void;
  className?: string;
};

export function BuilderCanvas({
  canvasRef,
  hierarchy,
  selection,
  pendingPartType,
  activeTool,
  zoomPercent,
  gridSizeMm,
  cursorX,
  cursorY,
  onCanvasPlace,
  onSelectNode,
  onMoveStructure,
  onCanvasDeselect,
  className,
}: BuilderCanvasProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    streetId: string;
    structureId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    streetId: string;
    structureId: string;
    x: number;
    y: number;
  } | null>(null);

  const canDrag = activeTool === 'select' || activeTool === 'move';

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if ((e.target as HTMLElement).closest('[data-canvas-node]')) return;

      const el = contentRef.current ?? canvasRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const { x, y } = getCanvasCoords(e.clientX, e.clientY, rect);

      if (pendingPartType) {
        onCanvasPlace(x, y);
        return;
      }
      onCanvasDeselect();
    },
    [canvasRef, pendingPartType, onCanvasPlace, onCanvasDeselect],
  );

  const handleStructureMouseDown = useCallback(
    (
      e: React.MouseEvent,
      street: LayoutStreet,
      structure: LayoutStructure,
    ) => {
      if (!canDrag) return;
      e.stopPropagation();
      onSelectNode({
        level: 'structure',
        streetId: street.id,
        structureId: structure.id,
      });

      const el = contentRef.current ?? canvasRef.current;
      const rect = el?.getBoundingClientRect();
      if (!rect) return;

      const { x, y } = getCanvasCoords(e.clientX, e.clientY, rect);
      dragStateRef.current = {
        streetId: street.id,
        structureId: structure.id,
        offsetX: x - structure.x,
        offsetY: y - structure.y,
      };
      setDragPreview({
        streetId: street.id,
        structureId: structure.id,
        x: structure.x,
        y: structure.y,
      });

      const handleMouseMove = (ev: MouseEvent) => {
        const area = contentRef.current ?? canvasRef.current;
        if (!dragStateRef.current || !area) return;
        const r = area.getBoundingClientRect();
        const coords = getCanvasCoords(ev.clientX, ev.clientY, r);
        setDragPreview({
          streetId: dragStateRef.current.streetId,
          structureId: dragStateRef.current.structureId,
          x: coords.x - dragStateRef.current.offsetX,
          y: coords.y - dragStateRef.current.offsetY,
        });
      };

      const handleMouseUp = (ev: MouseEvent) => {
        const area = contentRef.current ?? canvasRef.current;
        if (dragStateRef.current && area) {
          const r = area.getBoundingClientRect();
          const coords = getCanvasCoords(ev.clientX, ev.clientY, r);
          onMoveStructure(
            dragStateRef.current.streetId,
            dragStateRef.current.structureId,
            coords.x - dragStateRef.current.offsetX,
            coords.y - dragStateRef.current.offsetY,
          );
        }
        dragStateRef.current = null;
        setDragPreview(null);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [canDrag, canvasRef, onSelectNode, onMoveStructure],
  );

  const cursorClass = pendingPartType
    ? 'cursor-crosshair'
    : activeTool === 'move'
      ? 'cursor-move'
      : 'cursor-default';

  const totalComponents = hierarchy.streets.reduce(
    (a, s) => a + s.structures.reduce((b, st) => b + st.components.length, 0),
    0,
  );

  return (
    <main
      ref={canvasRef as RefObject<HTMLElement>}
      onClick={handleCanvasClick}
      className={cn(
        'relative min-h-0 flex-1 overflow-auto blueprint-grid',
        cursorClass,
        className,
      )}
    >
      <div className="pointer-events-none absolute left-8 top-8 z-10 flex gap-4">
        <div className={cn(glassPanelClassName, 'flex items-center gap-4 p-3')}>
          <div className="flex flex-col">
            <span className="font-mono text-[10px] font-bold uppercase text-primary">
              Zoom
            </span>
            <span className="text-xs text-foreground">{zoomPercent}%</span>
          </div>
          <div className="h-8 w-px bg-outline-variant" />
          <div className="flex flex-col">
            <span className="font-mono text-[10px] font-bold uppercase text-primary">
              Grid
            </span>
            <span className="text-xs text-foreground">{gridSizeMm}.0mm</span>
          </div>
        </div>
      </div>

      <div ref={contentRef} className="relative min-h-[600px] min-w-full p-8">
        {hierarchy.streets.length === 0 ? (
          <div className="flex h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-outline-variant">
            <p className="max-w-sm text-center text-sm text-muted-foreground">
              Crie uma <strong>rua</strong>, depois adicione <strong>estruturas</strong> e{' '}
              <strong>posições</strong> (componentes) na árvore à esquerda ou pela biblioteca
              de peças.
            </p>
          </div>
        ) : null}

        {hierarchy.streets.map((street) => (
          <StreetRegion
            key={street.id}
            street={street}
            selection={selection}
            dragPreview={dragPreview}
            canDrag={canDrag}
            onSelectStreet={() =>
              onSelectNode({ level: 'street', streetId: street.id })
            }
            onSelectStructure={(structureId) =>
              onSelectNode({
                level: 'structure',
                streetId: street.id,
                structureId,
              })
            }
            onSelectComponent={(structureId, componentId) =>
              onSelectNode({
                level: 'component',
                streetId: street.id,
                structureId,
                componentId,
              })
            }
            onStructureMouseDown={(e, structure) =>
              handleStructureMouseDown(e, street, structure)
            }
          />
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-6 left-6 z-10 flex items-center gap-4 font-mono text-[10px] text-muted-foreground">
        <span className="rounded border border-outline-variant bg-card px-2 py-1">
          CURSOR X: {cursorX.toFixed(2)}m
        </span>
        <span className="rounded border border-outline-variant bg-card px-2 py-1">
          CURSOR Y: {cursorY.toFixed(2)}m
        </span>
        <span className="rounded border border-outline-variant bg-card px-2 py-1">
          RUAS: {hierarchy.streets.length} · POS: {totalComponents}
        </span>
      </div>
    </main>
  );
}

function StreetRegion({
  street,
  selection,
  dragPreview,
  canDrag,
  onSelectStreet,
  onSelectStructure,
  onSelectComponent,
  onStructureMouseDown,
}: {
  street: LayoutStreet;
  selection: LayoutSelection | null;
  dragPreview: { streetId: string; structureId: string; x: number; y: number } | null;
  canDrag: boolean;
  onSelectStreet: () => void;
  onSelectStructure: (structureId: string) => void;
  onSelectComponent: (structureId: string, componentId: string) => void;
  onStructureMouseDown: (e: React.MouseEvent, structure: LayoutStructure) => void;
}) {
  const streetSelected =
    selection?.streetId === street.id && selection.level === 'street';

  return (
    <div
      data-canvas-node
      className={cn(
        'absolute rounded-xl border-2 border-dashed p-4 transition-colors',
        streetSelected
          ? 'border-primary/60 bg-primary/5'
          : 'border-outline-variant/50 bg-surface-low/30',
      )}
      style={{
        left: street.x,
        top: street.y,
        minWidth: 420,
        minHeight: 120,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelectStreet();
      }}
    >
      <div className="pointer-events-none mb-3 flex items-center gap-2">
        <span className="font-mono text-[10px] font-bold uppercase text-primary">
          {street.code}
        </span>
        <span className="text-[10px] text-muted-foreground">{street.name}</span>
      </div>

      <div className="relative min-h-[80px]">
        {street.structures.map((structure) => {
          const preview =
            dragPreview?.structureId === structure.id &&
            dragPreview.streetId === street.id
              ? dragPreview
              : null;
          const x = preview?.x ?? structure.x;
          const y = preview?.y ?? structure.y;
          const structSelected =
            selection?.structureId === structure.id &&
            selection.streetId === street.id;

          return (
            <StructureBlock
              key={structure.id}
              structure={structure}
              x={x}
              y={y}
              isSelected={!!structSelected}
              selectedComponentId={selection?.componentId ?? null}
              canDrag={canDrag}
              onMouseDown={(e) => onStructureMouseDown(e, structure)}
              onSelect={() => onSelectStructure(structure.id)}
              onSelectComponent={(componentId) =>
                onSelectComponent(structure.id, componentId)
              }
            />
          );
        })}
      </div>
    </div>
  );
}

function StructureBlock({
  structure,
  x,
  y,
  isSelected,
  selectedComponentId,
  canDrag,
  onMouseDown,
  onSelect,
  onSelectComponent,
}: {
  structure: LayoutStructure;
  x: number;
  y: number;
  isSelected: boolean;
  selectedComponentId: string | null;
  canDrag: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onSelect: () => void;
  onSelectComponent: (componentId: string) => void;
}) {
  const rackType = structure.rackType ?? 'porta-palete';
  const Icon = TYPE_ICONS[rackType];
  const isStorage = structure.components.some(
    (c) => c.kind === 'posicao-armazenagem',
  );

  return (
    <div
      data-canvas-node
      role="button"
      tabIndex={0}
      onMouseDown={onMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        'absolute flex flex-col rounded border-2 transition-shadow',
        canDrag && 'cursor-grab active:cursor-grabbing',
        isSelected
          ? 'border-secondary bg-secondary/10 ring-2 ring-secondary/30'
          : 'border-outline-variant bg-card/80 hover:border-primary/40',
        rackType === 'drive-in' && !isSelected && 'border-secondary/30',
      )}
      style={{
        left: x,
        top: y,
        width: structure.widthPx,
        minHeight: structure.heightPx,
      }}
    >
      <div className="flex flex-col gap-0.5 border-b border-outline-variant/30 px-2 py-1">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate font-mono text-[9px] font-bold text-foreground">
            {structure.code}
          </span>
          {structure.side ? (
            <span className="font-mono text-[8px] text-muted-foreground">
              S{structure.side}
            </span>
          ) : null}
        </div>
        <span className="truncate pl-5 text-[8px] text-muted-foreground">
          {structure.label}
        </span>
      </div>

      {isStorage && structure.components.length > 0 ? (
        <div className="flex flex-wrap gap-1 p-2">
          {structure.components.map((comp) => (
            <ComponentChip
              key={comp.id}
              component={comp}
              selected={selectedComponentId === comp.id}
              onSelect={(e) => {
                e.stopPropagation();
                onSelectComponent(comp.id);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="px-2 py-3 text-[10px] text-muted-foreground">
          {structure.label}
        </div>
      )}
    </div>
  );
}

function ComponentChip({
  component,
  selected,
  onSelect,
}: {
  component: LayoutComponent;
  selected: boolean;
  onSelect: (e: React.MouseEvent) => void;
}) {
  const subtitle = getComponentDisplayLabel(component);
  const cellLabel = subtitle
    ? `${subtitle} | ${component.loadLevels}`
    : `${component.code} | ${component.loadLevels}`;

  return (
    <button
      type="button"
      data-canvas-node
      onClick={onSelect}
      className={cn(
        'flex min-w-[40px] items-center justify-center rounded border px-1 py-0.5 font-mono text-[8px] transition-colors',
        selected
          ? 'border-primary bg-primary/20 text-primary'
          : 'border-outline-variant/40 bg-surface-low hover:border-primary/50',
      )}
    >
      <span className="text-center font-bold leading-tight">{cellLabel}</span>
    </button>
  );
}
