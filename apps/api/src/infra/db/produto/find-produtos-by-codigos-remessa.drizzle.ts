import { inArray, or } from 'drizzle-orm';

import type { ProdutoRecord } from '../../../domain/repositories/produto/produto.repository.js';
import type { DrizzleExecutor } from '../providers/drizzle/drizzle.provider.js';
import { produtos } from '../providers/drizzle/config/migrations/schema.js';
import { mapProdutoRow } from './map-produto.drizzle.js';

function resolverProdutoPorCodigo(
  codigo: string,
  porSku: Map<string, ProdutoRecord>,
  porProdutoId: Map<string, ProdutoRecord>,
): ProdutoRecord | null {
  const normalizado = codigo.trim();
  if (!normalizado) {
    return null;
  }

  const porSkuMatch = porSku.get(normalizado);
  if (porSkuMatch) {
    return porSkuMatch;
  }

  return porProdutoId.get(normalizado) ?? null;
}

export async function findProdutosByCodigosRemessaDb(
  db: DrizzleExecutor,
  codigos: string[],
): Promise<Map<string, ProdutoRecord | null>> {
  const codigosNormalizados = [
    ...new Set(codigos.map((codigo) => codigo.trim()).filter(Boolean)),
  ];

  const resultado = new Map<string, ProdutoRecord | null>(
    codigosNormalizados.map((codigo) => [codigo, null]),
  );

  if (codigosNormalizados.length === 0) {
    return resultado;
  }

  const rows = await db
    .select()
    .from(produtos)
    .where(
      or(
        inArray(produtos.sku, codigosNormalizados),
        inArray(produtos.produtoId, codigosNormalizados),
      ),
    );

  const porSku = new Map<string, ProdutoRecord>();
  const porProdutoId = new Map<string, ProdutoRecord>();

  for (const row of rows) {
    const produto = mapProdutoRow(row);
    porSku.set(produto.sku, produto);
    porProdutoId.set(produto.produtoId, produto);
  }

  for (const codigo of codigosNormalizados) {
    resultado.set(
      codigo,
      resolverProdutoPorCodigo(codigo, porSku, porProdutoId),
    );
  }

  return resultado;
}
