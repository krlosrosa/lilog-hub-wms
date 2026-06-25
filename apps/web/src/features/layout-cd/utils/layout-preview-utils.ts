import type {
  LayoutSelection,
  WarehouseLayout,
  WarehousePosition,
} from '@/features/layout-cd/types/layout-cd.schema';

export function collectWarehousePositions(
  layout: WarehouseLayout,
): WarehousePosition[] {
  return [
    ...(layout.transversalBands ?? []).flatMap((b) => b.positions),
    ...layout.aisles.flatMap((a) => a.sides.flatMap((s) => s.positions)),
    ...layout.driveInLanes.flatMap((l) => l.positions),
  ];
}

export function findPosIdByComponentId(
  layout: WarehouseLayout,
  componentId: string,
): string | null {
  const pos = collectWarehousePositions(layout).find(
    (p) => p.sourceComponentId === componentId,
  );
  return pos?.posId ?? null;
}

export function selectionToPosId(
  layout: WarehouseLayout,
  selection: LayoutSelection | null,
): string | null {
  if (!selection || selection.level !== 'component' || !selection.componentId) {
    return null;
  }
  return findPosIdByComponentId(layout, selection.componentId);
}

export function positionToSelection(
  position: WarehousePosition,
): LayoutSelection | null {
  if (!position.sourceStructureId || !position.sourceComponentId) {
    return null;
  }
  if (position.sourceCabecaId) {
    return {
      level: 'component',
      cabecaId: position.sourceCabecaId,
      structureId: position.sourceStructureId,
      componentId: position.sourceComponentId,
    };
  }
  if (!position.sourceStreetId) return null;
  return {
    level: 'component',
    streetId: position.sourceStreetId,
    structureId: position.sourceStructureId,
    componentId: position.sourceComponentId,
  };
}

export function countPreviewSlots(layout: WarehouseLayout): number {
  return collectWarehousePositions(layout).length;
}
