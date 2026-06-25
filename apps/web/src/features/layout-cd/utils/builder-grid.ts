import { BUILDER_GRID_PX } from '@/features/layout-cd/types/layout-cd.schema';

export function snapToGrid(value: number, gridPx = BUILDER_GRID_PX): number {
  return Math.round(value / gridPx) * gridPx;
}

export function getCanvasCoords(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): { x: number; y: number } {
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}
