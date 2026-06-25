const STORAGE_PREFIX = 'devolucao:conferencia-sku';

function storageKey(demandId: string): string {
  return `${STORAGE_PREFIX}:${demandId}`;
}

export function setConferenciaSkuSession(demandId: string, sku: string): void {
  sessionStorage.setItem(storageKey(demandId), sku.trim());
}

export function getConferenciaSkuSession(demandId: string): string | null {
  const sku = sessionStorage.getItem(storageKey(demandId));
  return sku?.trim() ? sku : null;
}

export function clearConferenciaSkuSession(demandId: string): void {
  sessionStorage.removeItem(storageKey(demandId));
}
