import { ELEMENT_META } from '@/features/armazem-layout/constants';
import type { ElementType, LayoutElement, WarehouseLayout } from '@/features/armazem-layout/types';

export function generateId(): string {
  return `el-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyLayout(): WarehouseLayout {
  return {
    name: 'Armazém Principal',
    gridCols: 28,
    gridRows: 18,
    elements: [],
  };
}

export function nextLabelFor(type: ElementType, elements: LayoutElement[]): string {
  const meta = ELEMENT_META[type];
  const prefix = meta.labelPrefix;
  const count = elements.filter((e) => e.type === type).length + 1;
  return `${prefix}-${String(count).padStart(2, '0')}`;
}

export function createElementAt(
  type: ElementType,
  gx: number,
  gy: number,
  elements: LayoutElement[],
): LayoutElement {
  const meta = ELEMENT_META[type];
  return {
    id: generateId(),
    type,
    gx,
    gy,
    gw: meta.defaultGw,
    gh: meta.defaultGh,
    label: nextLabelFor(type, elements),
    ...(type === 'estante' ? { levels: meta.defaultLevels ?? 3, zona: 'A' } : {}),
  };
}

export function clampToGrid(
  gx: number,
  gy: number,
  gw: number,
  gh: number,
  gridCols: number,
  gridRows: number,
): { gx: number; gy: number } {
  return {
    gx: Math.max(0, Math.min(gx, gridCols - gw)),
    gy: Math.max(0, Math.min(gy, gridRows - gh)),
  };
}

export function gridToPixel(
  gx: number,
  gy: number,
  gw: number,
  gh: number,
  cellSize: number,
  margin: number,
): { x: number; y: number; w: number; h: number } {
  return {
    x: margin + gx * cellSize,
    y: margin + gy * cellSize,
    w: gw * cellSize,
    h: gh * cellSize,
  };
}

export function pixelToGrid(
  px: number,
  py: number,
  cellSize: number,
  margin: number,
): { gx: number; gy: number } {
  return {
    gx: Math.floor((px - margin) / cellSize),
    gy: Math.floor((py - margin) / cellSize),
  };
}

export function layoutPixelSize(
  gridCols: number,
  gridRows: number,
  cellSize: number,
  margin: number,
): { width: number; height: number } {
  return {
    width: margin * 2 + gridCols * cellSize,
    height: margin * 2 + gridRows * cellSize,
  };
}

export function elementsOverlap(a: LayoutElement, b: LayoutElement): boolean {
  if (a.id === b.id) return false;
  return (
    a.gx < b.gx + b.gw &&
    a.gx + a.gw > b.gx &&
    a.gy < b.gy + b.gh &&
    a.gy + a.gh > b.gy
  );
}

export function canPlaceElement(
  element: LayoutElement,
  elements: LayoutElement[],
  gridCols: number,
  gridRows: number,
  excludeId?: string,
): boolean {
  if (element.gx < 0 || element.gy < 0) return false;
  if (element.gx + element.gw > gridCols) return false;
  if (element.gy + element.gh > gridRows) return false;

  return !elements.some(
    (other) =>
      other.id !== excludeId &&
      other.id !== element.id &&
      elementsOverlap(element, other),
  );
}
