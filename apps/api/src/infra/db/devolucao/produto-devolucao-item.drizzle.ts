import { eq, sql, type SQLWrapper } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { produtos } from '../providers/drizzle/config/migrations/schema.js';

export const produtoPorProdutoId = alias(produtos, 'produto_por_produto_id');
export const produtoPorSku = alias(produtos, 'produto_por_sku');
export const produtoPorCodigoProdutoId = alias(
  produtos,
  'produto_por_codigo_produto_id',
);

function coalesce<T>(...parts: SQLWrapper[]) {
  return sql<T>`coalesce(${sql.join(parts, sql`, `)})`;
}

export const produtoTipoDevolucaoItem = coalesce<string | null>(
  produtoPorProdutoId.tipo,
  produtoPorSku.tipo,
  produtoPorCodigoProdutoId.tipo,
);

export function joinProdutoDevolucaoItemPorProdutoId(
  produtoIdColumn: typeof produtos.produtoId | SQLWrapper,
) {
  return eq(produtoIdColumn, produtoPorProdutoId.produtoId);
}

export function joinProdutoDevolucaoItemPorSku(
  skuColumn: typeof produtos.sku | SQLWrapper,
) {
  return eq(sql`trim(${skuColumn})`, produtoPorSku.sku);
}

export function joinProdutoDevolucaoItemPorCodigoProdutoId(
  skuColumn: typeof produtos.sku | SQLWrapper,
) {
  return eq(sql`trim(${skuColumn})`, produtoPorCodigoProdutoId.produtoId);
}

export function isProdutoTipoPvar(tipo: string | null | undefined): boolean {
  return tipo === 'PVAR';
}
