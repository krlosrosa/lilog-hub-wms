import type { ExpectedItemView } from '@lilog/contracts';

import type { ProductRecord } from '@/features/recebimento-v2/local-db/schema';
import { isResolvableCatalogProduct } from '@/features/recebimento-v2/lib/resolve-produto-conferencia-v2';
import { repairProductCatalogForSku } from '@/features/recebimento-v2/services/enrich-product-catalog.service';

import {
  findExpectedItemBySku,
  mapExpectedItemToProduct,
} from './map-expected-item-to-product';

function mergeExpectedWithCatalog(
  expected: ProductRecord,
  catalog: ProductRecord,
  item: ExpectedItemView,
): ProductRecord {
  const placeholderDescription =
    item.descricao.trim() === 'Adicionando...' || !item.descricao.trim();

  return {
    ...catalog,
    produtoId: expected.produtoId,
    sku: expected.sku,
    description: placeholderDescription ? catalog.description : expected.description,
    unidadeId: expected.unidadeId,
    unidadesPorCaixa: expected.unidadesPorCaixa || catalog.unidadesPorCaixa,
    controlaLote: expected.controlaLote,
    controlaValidade: expected.controlaValidade,
    controlaPeso: expected.controlaPeso,
    pesoVariavel: expected.pesoVariavel,
  };
}

export async function resolveProductForConferenciaRcAsync(
  expectedItems: ExpectedItemView[],
  sku: string | undefined,
  unidadeId: string | undefined,
): Promise<ProductRecord | null> {
  if (!sku?.trim() || !unidadeId) {
    return null;
  }

  const expectedItem = findExpectedItemBySku(expectedItems, sku);
  const catalogProduct = await repairProductCatalogForSku(sku, unidadeId);

  if (expectedItem) {
    const fromExpected = mapExpectedItemToProduct(expectedItem, unidadeId);
    if (catalogProduct && isResolvableCatalogProduct(catalogProduct)) {
      return mergeExpectedWithCatalog(fromExpected, catalogProduct, expectedItem);
    }
    return isResolvableCatalogProduct(fromExpected) ? fromExpected : null;
  }

  return isResolvableCatalogProduct(catalogProduct) ? catalogProduct : null;
}
