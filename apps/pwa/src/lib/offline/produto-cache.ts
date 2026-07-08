import type { ConferenciaItemMeta } from '@/features/recebimento/lib/map-conferencia-itens';
import type { ProdutoApi } from '@/features/recebimento/types/recebimento.api';
import { isApiConfigured } from '@/lib/offline/api-client';
import type { ProdutoConferenciaConfigForm } from '@/features/recebimento/types/recebimento.schema';

import { db } from './db';

export type ProdutoApiResponse = {
  produtoId?: string;
  id?: string;
  sku: string;
  descricao: string;
  ean?: string | null;
  unidadesPorCaixa?: number;
  tipo: string;
  categoria: string;
  shelfLife?: number | null;
};

export function mapProdutoApiResponse(item: ProdutoApiResponse): ProdutoApi {
  return {
    produtoId: item.produtoId ?? item.id ?? '',
    sku: item.sku,
    descricao: item.descricao,
    ean: item.ean ?? null,
    unidadesPorCaixa: item.unidadesPorCaixa ?? 1,
    tipo: item.tipo,
    categoria: item.categoria,
    shelfLife: item.shelfLife ?? null,
  };
}

export function produtoToConfig(
  produto: ProdutoApi,
  solicitarPesoPvar = true,
  exigirEtiquetaPesoVariavel = false,
): ProdutoConferenciaConfigForm {
  const isPvar = produto.tipo === 'PVAR' && solicitarPesoPvar;

  return {
    controlaLote:
      produto.categoria === 'refrigerado' || produto.categoria === 'queijo',
    controlaValidade: produto.shelfLife !== null,
    controlaPeso: isPvar,
    pesoVariavel: isPvar,
    exigirEtiquetaPesoVariavel: isPvar && exigirEtiquetaPesoVariavel,
    controlaNumeroSerie: false,
  };
}

export function produtoToMeta(
  produto: ProdutoApi,
  solicitarPesoPvar = true,
  exigirEtiquetaPesoVariavel = false,
): ConferenciaItemMeta {
  return {
    produtoId: produto.produtoId,
    sku: produto.sku,
    descricao: produto.descricao,
    unidadeMedida: 'UN',
    unidadesPorCaixa: produto.unidadesPorCaixa,
    config: produtoToConfig(
      produto,
      solicitarPesoPvar,
      exigirEtiquetaPesoVariavel,
    ),
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

  if (matches.length === 1) return matches[0] ?? null;
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
