import { isApiConfigured } from '@/lib/offline/api-client';
import type { ProdutoApi } from '@/features/recebimento/types/recebimento.api';

import {
  isExactProductCodeMatch,
  isProdutoTipoPvar,
  normalizeSkuParam,
  resolveProductCatalogFlags,
  resolveProductForSkuV2,
} from '../lib/resolve-produto-conferencia-v2.js';
import { recebimentoV2Db } from '../local-db/db.js';
import type { ProductRecord } from '../local-db/schema.js';

export function productNeedsCatalogRepair(
  product: ProductRecord | null | undefined,
): boolean {
  if (!product) return false;
  if (!product.tipo?.trim()) return true;
  if (isProdutoTipoPvar(product.tipo) && !product.pesoVariavel) return true;
  return false;
}

export function mapProdutoApiToProductRecord(
  produto: ProdutoApi,
  unidadeId: string,
  existing?: ProductRecord | null,
): ProductRecord {
  const tipo = produto.tipo?.trim() || existing?.tipo || '';
  const categoria = produto.categoria?.trim() || existing?.categoria || '';
  const shelfLife = produto.shelfLife ?? existing?.shelfLife ?? 0;
  const flags = resolveProductCatalogFlags({
    tipo,
    pesoVariavel: existing?.pesoVariavel ?? false,
    categoria,
    shelfLife,
    controlaLote: existing?.controlaLote ?? false,
    controlaValidade: existing?.controlaValidade ?? false,
    controlaPeso: existing?.controlaPeso ?? false,
  });

  return {
    produtoId: produto.produtoId,
    sku: produto.sku,
    description: produto.descricao?.trim() || existing?.description || '',
    unidadeId: existing?.unidadeId || unidadeId,
    empresa: existing?.empresa ?? '',
    categoria,
    tipo,
    ean: produto.ean ?? existing?.ean ?? '',
    dum: existing?.dum ?? '',
    shelfLife,
    pesoBrutoUnidade: existing?.pesoBrutoUnidade ?? 0,
    pesoBrutoCaixa: existing?.pesoBrutoCaixa ?? 0,
    pesoBrutoPalete: existing?.pesoBrutoPalete ?? 0,
    pesoLiquidoUnidade: existing?.pesoLiquidoUnidade ?? 0,
    pesoLiquidoCaixa: existing?.pesoLiquidoCaixa ?? 0,
    pesoLiquidoPalete: existing?.pesoLiquidoPalete ?? 0,
    unidadesPorCaixa: produto.unidadesPorCaixa || existing?.unidadesPorCaixa || 1,
    caixasPorPalete: existing?.caixasPorPalete ?? 0,
    controlaLote: flags.controlaLote,
    controlaValidade: flags.controlaValidade,
    controlaPeso: flags.controlaPeso,
    pesoVariavel: flags.pesoVariavel,
    serverRevision: existing?.serverRevision ?? 0,
    updatedAt: Date.now(),
    deletedAt: null,
  };
}

async function fetchProdutoFromApi(sku: string): Promise<ProdutoApi | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;
  if (!isApiConfigured()) return null;

  const { searchProduto } = await import(
    '@/features/recebimento/lib/recebimento-api.js'
  );
  return searchProduto(sku);
}

export async function repairProductCatalogForSku(
  sku: string,
  unidadeId: string,
): Promise<ProductRecord | null> {
  const normalizedSku = normalizeSkuParam(sku);
  if (!normalizedSku) return null;

  const existing = await recebimentoV2Db.products
    .filter(
      (product) =>
        !product.deletedAt &&
        normalizeSkuParam(product.sku).toUpperCase() === normalizedSku.toUpperCase(),
    )
    .first();

  if (existing && !productNeedsCatalogRepair(existing)) {
    return existing;
  }

  const fromApi = await fetchProdutoFromApi(normalizedSku);
  if (!fromApi || !isExactProductCodeMatch(normalizedSku, fromApi.sku, fromApi.ean)) {
    return existing ?? null;
  }

  const record = mapProdutoApiToProductRecord(fromApi, unidadeId, existing);
  await recebimentoV2Db.products.put(record);
  return record;
}

/**
 * Resolve produto para conferência, reparando tipo/PVAR no catálogo local via API quando necessário.
 */
export async function resolveProductForConferenciaV2(
  demandId: string,
  sku: string,
  unidadeId?: string,
): Promise<ProductRecord | null> {
  let product = await resolveProductForSkuV2(demandId, sku);

  if (!unidadeId?.trim()) {
    const process = await recebimentoV2Db.processes.get(demandId);
    unidadeId = process?.unidadeId;
  }

  if (!unidadeId?.trim()) {
    return product;
  }

  if (product && !productNeedsCatalogRepair(product)) {
    return product;
  }

  const repaired = await repairProductCatalogForSku(
    product?.sku ?? sku,
    unidadeId,
  );

  if (repaired) {
    product = await resolveProductForSkuV2(demandId, sku);
    if (product && !productNeedsCatalogRepair(product)) {
      return product;
    }
    if (product && repaired.produtoId === product.produtoId) {
      return {
        ...product,
        tipo: repaired.tipo,
        categoria: repaired.categoria,
        shelfLife: repaired.shelfLife,
        pesoVariavel: repaired.pesoVariavel,
        controlaLote: repaired.controlaLote,
        controlaValidade: repaired.controlaValidade,
        controlaPeso: repaired.controlaPeso,
      };
    }
    return repaired;
  }

  return product;
}

export async function enrichDemandProductCatalog(
  demandId: string,
  unidadeId?: string,
): Promise<void> {
  const resolvedUnidadeId =
    unidadeId?.trim() ||
    (await recebimentoV2Db.processes.get(demandId))?.unidadeId ||
    '';

  if (!resolvedUnidadeId) return;

  const items = await recebimentoV2Db.expectedItems
    .where('demandId')
    .equals(demandId)
    .toArray();

  if (items.length === 0) return;

  const produtoIds = items.map((item) => item.produtoId);
  const catalogProducts = await recebimentoV2Db.products.bulkGet(produtoIds);

  const needsRepair = catalogProducts.some(
    (product) => product && product.deletedAt === null && productNeedsCatalogRepair(product),
  );

  if (!needsRepair) return;

  for (const item of items) {
    const catalog = catalogProducts.find((p) => p?.produtoId === item.produtoId);
    if (catalog && !productNeedsCatalogRepair(catalog)) continue;

    const sku = item.sku !== item.produtoId ? item.sku : catalog?.sku;
    if (!sku?.trim()) continue;

    await repairProductCatalogForSku(sku, resolvedUnidadeId);
  }
}
