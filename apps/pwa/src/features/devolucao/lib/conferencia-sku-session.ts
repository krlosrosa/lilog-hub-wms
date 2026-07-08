const STORAGE_PREFIX = 'devolucao:conferencia-sku';

type ConferenciaSession = {
  sku: string;
  itemId?: string;
  descricao?: string;
};

function storageKey(demandId: string): string {
  return `${STORAGE_PREFIX}:${demandId}`;
}

function parseSession(raw: string | null): ConferenciaSession | null {
  if (!raw?.trim()) return null;

  try {
    const parsed = JSON.parse(raw) as ConferenciaSession;
    if (parsed.sku?.trim()) {
      return {
        sku: parsed.sku.trim(),
        itemId: parsed.itemId,
        descricao: parsed.descricao?.trim() || undefined,
      };
    }
  } catch {
    return { sku: raw.trim() };
  }

  return null;
}

export function setConferenciaSkuSession(
  demandId: string,
  sku: string,
  itemId?: string,
  descricao?: string,
): void {
  const payload: ConferenciaSession = {
    sku: sku.trim(),
    ...(itemId ? { itemId } : {}),
    ...(descricao?.trim() ? { descricao: descricao.trim() } : {}),
  };
  sessionStorage.setItem(storageKey(demandId), JSON.stringify(payload));
}

export function getConferenciaSkuSession(demandId: string): string | null {
  return parseSession(sessionStorage.getItem(storageKey(demandId)))?.sku ?? null;
}

export function getConferenciaItemSession(
  demandId: string,
): ConferenciaSession | null {
  return parseSession(sessionStorage.getItem(storageKey(demandId)));
}

export function clearConferenciaSkuSession(demandId: string): void {
  sessionStorage.removeItem(storageKey(demandId));
}
