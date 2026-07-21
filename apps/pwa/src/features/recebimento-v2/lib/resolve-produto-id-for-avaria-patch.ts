import { getExpectedItemBySkuDirect } from '@/lib/replicache/queries';

import { debugRecebimentoV2 } from './sync-debug';
import {
  normalizeSkuParam,
  resolveProductForSkuV2,
  resolveProdutoIdForSkuV2,
} from './resolve-produto-conferencia-v2';

function isLikelySkuFallback(produtoId: string, sku: string): boolean {
  const normalizedSku = normalizeSkuParam(sku).toUpperCase();
  return produtoId.toUpperCase() === normalizedSku;
}

/**
 * Resolves produtoId for avaria patch payloads.
 * Dexie expectedItems first (v2), then Replicache (RC pilot).
 */
export async function resolveProductIdForAvariaPatch(
  demandId: string,
  sku: string,
): Promise<string | undefined> {
  const product = await resolveProductForSkuV2(demandId, sku);
  const produtoId = await resolveProdutoIdForSkuV2(demandId, sku, product);

  if (produtoId && !produtoId.startsWith('novo-') && !isLikelySkuFallback(produtoId, sku)) {
    return produtoId;
  }

  const expectedItem = await getExpectedItemBySkuDirect(demandId, sku);
  if (expectedItem?.produtoId && !expectedItem.produtoId.startsWith('novo-')) {
    debugRecebimentoV2('produto', 'resolveProductIdForAvariaPatch', {
      demandId,
      sku,
      source: 'replicache-expected-item',
      produtoId: expectedItem.produtoId,
    });
    return expectedItem.produtoId;
  }

  if (produtoId && !isLikelySkuFallback(produtoId, sku)) {
    return produtoId;
  }

  debugRecebimentoV2('produto', 'resolveProductIdForAvariaPatch', {
    demandId,
    sku,
    source: 'unresolved',
    produtoId: produtoId ?? null,
  });

  return produtoId;
}
