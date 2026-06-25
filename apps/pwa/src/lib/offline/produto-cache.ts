import type { ConferenciaItemMeta } from '@/features/recebimento/lib/map-conferencia-itens';
import type { ProdutoApi } from '@/features/recebimento/types/recebimento.api';
import { isApiConfigured } from '@/lib/offline/api-client';
import type { ProdutoConferenciaConfigForm } from '@/features/recebimento/types/recebimento.schema';

import { db } from './db';

type ProdutoApiResponse = ProdutoApi & {
  produtoId?: string;
};

export function mapProdutoApiResponse(item: ProdutoApiResponse): ProdutoApi {
  return {
    id: item.produtoId ?? item.id,
    sku: item.sku,
    descricao: item.descricao,
    ean: item.ean ?? null,
    unidadesPorCaixa: item.unidadesPorCaixa ?? 1,
    tipo: item.tipo,
    categoria: item.categoria,
    shelfLife: item.shelfLife ?? null,
  };
}

export function produtoToConfig(produto: ProdutoApi): ProdutoConferenciaConfigForm {
  return {
    controlaLote:
      produto.categoria === 'refrigerado' || produto.categoria === 'queijo',
    controlaValidade: produto.shelfLife !== null,
    controlaPeso: produto.tipo === 'PVAR',
    pesoVariavel: produto.tipo === 'PVAR',
    controlaNumeroSerie: false,
  };
}

export function produtoToMeta(produto: ProdutoApi): ConferenciaItemMeta {
  return {
    produtoId: produto.id,
    sku: produto.sku,
    descricao: produto.descricao,
    unidadeMedida: 'UN',
    unidadesPorCaixa: produto.unidadesPorCaixa,
    config: produtoToConfig(produto),
  };
}

export async function saveDemandProdutos(
  demandId: string,
  produtos: ProdutoApi[],
): Promise<void> {
  await db.demandProdutos.put({
    demandId,
    produtos,
    cachedAt: Date.now(),
  });
}

export async function loadDemandProdutos(demandId: string): Promise<ProdutoApi[]> {
  const entry = await db.demandProdutos.get(demandId);
  return entry?.produtos ?? [];
}

function normalizeSearchTerm(term: string): string {
  return term.trim().toLowerCase();
}

export function findProdutoInCatalog(
  term: string,
  catalog: ProdutoApi[],
): ProdutoApi | null {
  const normalized = normalizeSearchTerm(term);
  if (!normalized) return null;

  const exact = catalog.find(
    (produto) =>
      produto.sku.toLowerCase() === normalized ||
      produto.ean?.toLowerCase() === normalized,
  );
  if (exact) return exact;

  const matches = catalog.filter(
    (produto) =>
      produto.sku.toLowerCase().includes(normalized) ||
      produto.descricao.toLowerCase().includes(normalized) ||
      produto.ean?.toLowerCase().includes(normalized),
  );

  if (matches.length === 1) return matches[0];
  return null;
}

export async function searchProdutoWithCache(
  demandId: string,
  term: string,
): Promise<ProdutoApi | null> {
  const catalog = await loadDemandProdutos(demandId);
  const fromCache = findProdutoInCatalog(term, catalog);
  if (fromCache) return fromCache;

  if (!navigator.onLine || !isApiConfigured()) {
    return null;
  }

  const { searchProduto } = await import(
    '@/features/recebimento/lib/recebimento-api'
  );
  return searchProduto(term);
}
