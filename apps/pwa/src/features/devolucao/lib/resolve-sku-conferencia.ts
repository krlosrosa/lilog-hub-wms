import type { SkuItem } from '../types/devolucao.schema';

export type SkuConferenciaPreview =
  | { source: 'carga'; item: SkuItem }
  | { source: 'novo'; sku: string };

export type ResolveSkuResult =
  | { ok: true; sku: string; preview: SkuConferenciaPreview }
  | { ok: false; error: string };

function normalizeSkuInput(term: string): string {
  return term.trim();
}

function findCargoMatches(term: string, items: SkuItem[]): SkuItem[] {
  const lower = term.toLowerCase();
  return items.filter(
    (item) =>
      item.sku.toLowerCase().includes(lower) || item.name.toLowerCase().includes(lower)
  );
}

export function previewSkuForConferencia(
  term: string,
  items: SkuItem[]
): SkuConferenciaPreview | null {
  const normalized = normalizeSkuInput(term);
  if (normalized.length < 3) return null;

  const lower = normalized.toLowerCase();
  const exact = items.find((item) => item.sku.toLowerCase() === lower);
  if (exact) {
    return { source: 'carga', item: exact };
  }

  const matches = findCargoMatches(normalized, items);
  if (matches.length === 1) {
    return { source: 'carga', item: matches[0] };
  }
  if (matches.length > 1) return null;

  return { source: 'novo', sku: normalized.toUpperCase() };
}

export function resolveSkuForConferencia(term: string, items: SkuItem[]): ResolveSkuResult {
  const normalized = normalizeSkuInput(term);
  if (!normalized) {
    return { ok: false, error: 'Informe o SKU ou código do produto' };
  }
  if (normalized.length < 3) {
    return { ok: false, error: 'SKU deve ter pelo menos 3 caracteres' };
  }

  const lower = normalized.toLowerCase();
  const exact = items.find((item) => item.sku.toLowerCase() === lower);
  if (exact) {
    return {
      ok: true,
      sku: exact.sku,
      preview: { source: 'carga', item: exact },
    };
  }

  const matches = findCargoMatches(normalized, items);
  if (matches.length === 1) {
    return {
      ok: true,
      sku: matches[0].sku,
      preview: { source: 'carga', item: matches[0] },
    };
  }

  if (matches.length > 1) {
    return { ok: false, error: 'Vários itens encontrados — informe o SKU completo' };
  }

  const sku = normalized.toUpperCase();
  return {
    ok: true,
    sku,
    preview: { source: 'novo', sku },
  };
}
