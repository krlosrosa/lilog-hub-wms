import { findProdutoInCatalog } from '@/lib/offline/produto-cache';

import type { ProdutoApi } from '../types/recebimento.api';
import type { SkuItem } from '../types/recebimento.schema';

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
  items: SkuItem[],
  catalog?: ProdutoApi[],
): SkuConferenciaPreview | null {
  const normalized = normalizeSkuInput(term);
  if (normalized.length < 3) return null;

  const lower = normalized.toLowerCase();
  const exact = items.find((item) => item.sku.toLowerCase() === lower);
  if (exact && exact.status !== 'conferido') {
    return { source: 'carga', item: exact };
  }

  const matches = findCargoMatches(normalized, items);
  if (matches.length === 1 && matches[0].status !== 'conferido') {
    return { source: 'carga', item: matches[0] };
  }
  if (matches.length > 1) return null;

  const catalogMatch = catalog ? findProdutoInCatalog(normalized, catalog) : null;
  if (catalogMatch) {
    return { source: 'novo', sku: catalogMatch.sku };
  }

  return { source: 'novo', sku: normalized.toUpperCase() };
}

export function resolveSkuForConferencia(
  term: string,
  items: SkuItem[],
  catalog?: ProdutoApi[],
): ResolveSkuResult {
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
    if (exact.status === 'conferido') {
      return { ok: false, error: 'Este item já foi conferido' };
    }
    return {
      ok: true,
      sku: exact.sku,
      preview: { source: 'carga', item: exact },
    };
  }

  const matches = findCargoMatches(normalized, items);
  if (matches.length === 1) {
    if (matches[0].status === 'conferido') {
      return { ok: false, error: 'Este item já foi conferido' };
    }
    return {
      ok: true,
      sku: matches[0].sku,
      preview: { source: 'carga', item: matches[0] },
    };
  }

  if (matches.length > 1) {
    return { ok: false, error: 'Vários itens encontrados — informe o SKU completo' };
  }

  if (catalog?.length) {
    const produto = findProdutoInCatalog(normalized, catalog);
    if (!produto) {
      return { ok: false, error: 'Produto não encontrado no catálogo' };
    }

    return {
      ok: true,
      sku: produto.sku,
      preview: { source: 'novo', sku: produto.sku },
    };
  }

  const sku = normalized.toUpperCase();
  return {
    ok: true,
    sku,
    preview: { source: 'novo', sku },
  };
}
