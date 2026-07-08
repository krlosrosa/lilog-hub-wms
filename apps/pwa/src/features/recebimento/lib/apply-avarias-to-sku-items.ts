import type { AvariaRegistro, SkuItem } from '../types/recebimento.schema';

function collectSkusWithAvaria(avarias: AvariaRegistro[]): Set<string> {
  const skus = new Set<string>();

  for (const avaria of avarias) {
    if (avaria.sku) {
      skus.add(avaria.sku.toLowerCase());
    }

    for (const sku of avaria.skusAfetados ?? []) {
      skus.add(sku.toLowerCase());
    }
  }

  return skus;
}

function collectProdutoIdsWithAvaria(avarias: AvariaRegistro[]): Set<string> {
  const produtoIds = new Set<string>();

  for (const avaria of avarias) {
    if (avaria.produtoId) {
      produtoIds.add(avaria.produtoId);
    }
  }

  return produtoIds;
}

export function applyAvariasToSkuItems(
  itens: SkuItem[],
  avarias: AvariaRegistro[],
  itemMetaBySku: Record<string, { produtoId: string }> = {},
): SkuItem[] {
  if (avarias.length === 0) {
    return itens;
  }

  const skusWithAvaria = collectSkusWithAvaria(avarias);
  const produtoIdsWithAvaria = collectProdutoIdsWithAvaria(avarias);

  return itens.map((item) => {
    const produtoId = itemMetaBySku[item.sku.toLowerCase()]?.produtoId;
    const hasAvaria =
      skusWithAvaria.has(item.sku.toLowerCase()) ||
      (produtoId != null && produtoIdsWithAvaria.has(produtoId)) ||
      item.hasAvaria === true;

    if (!hasAvaria) {
      return item;
    }

    return { ...item, hasAvaria: true };
  });
}
