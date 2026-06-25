import {
  publishedLayoutSchema,
  type CanvasItem,
  type LayoutHierarchy,
  type PublishedLayout,
} from '@/features/layout-cd/types/layout-cd.schema';
import { canvasItemsToHierarchy } from '@/features/layout-cd/utils/canvas-to-hierarchy';
import { hierarchyToWarehouseLayout } from '@/features/layout-cd/utils/hierarchy-to-warehouse-layout';

const STORAGE_KEY = 'lilog-layout-cd-published';

export function savePublishedLayout(layout: PublishedLayout): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

/** Persiste hierarquia e recalcula o mapa do armazém (fonte única de verdade). */
export function saveLayoutFromHierarchy(hierarchy: LayoutHierarchy): void {
  const warehouse = hierarchyToWarehouseLayout(hierarchy);
  savePublishedLayout({ hierarchy, warehouse });
}

export function loadPublishedLayout(): PublishedLayout | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const json = JSON.parse(raw) as Record<string, unknown>;
    if (!json.hierarchy && Array.isArray(json.canvasItems)) {
      json.hierarchy = canvasItemsToHierarchy(json.canvasItems as CanvasItem[]);
    }
    const parsed = publishedLayoutSchema.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function loadPublishedHierarchy(): LayoutHierarchy | null {
  return loadPublishedLayout()?.hierarchy ?? null;
}

export function clearPublishedLayout(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function hasPublishedLayout(): boolean {
  return loadPublishedLayout() !== null;
}
