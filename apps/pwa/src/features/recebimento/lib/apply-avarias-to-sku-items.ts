import type { AvariaRegistro, SkuItem } from '../types/recebimento.schema';
import { filterAvariasForSku } from './avaria-quantidade';

export function applyAvariasToSkuItems(
  itens: SkuItem[],
  avarias: AvariaRegistro[],
  itemMetaBySku: Record<string, { produtoId: string }> = {},
): SkuItem[] {
  if (avarias.length === 0) {
    return itens;
  }

  return itens.map((item) => {
    const produtoId = itemMetaBySku[item.sku.toLowerCase()]?.produtoId;
    const hasAvaria =
      filterAvariasForSku(avarias, item.sku, produtoId).length > 0 ||
      item.hasAvaria === true;

    if (!hasAvaria) {
      return item;
    }

    return { ...item, hasAvaria: true };
  });
}
