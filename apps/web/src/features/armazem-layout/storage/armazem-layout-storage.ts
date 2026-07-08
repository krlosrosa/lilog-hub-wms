import {
  warehouseLayoutSchema,
  type WarehouseLayout,
} from '@/features/armazem-layout/types';

const STORAGE_KEY = 'lilog-armazem-layout';

export function loadLayout(): WarehouseLayout | null {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = warehouseLayoutSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveLayout(layout: WarehouseLayout): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

export function clearLayout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function downloadLayoutJson(layout: WarehouseLayout): void {
  const blob = new Blob([JSON.stringify(layout, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${layout.name.replace(/\s+/g, '-').toLowerCase()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parseImportedLayoutJson(raw: string): WarehouseLayout {
  const json = JSON.parse(raw) as unknown;
  const parsed = warehouseLayoutSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error('JSON de layout inválido.');
  }
  return parsed.data;
}
