import { inArray, or } from 'drizzle-orm';

import { isProdutoUuid } from '../../../application/services/expedicao/resolver-endereco-produto-slotting.js';
import type { ProdutoRecord } from '../../../domain/repositories/produto/produto.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { produtos } from '../providers/drizzle/config/migrations/schema.js';
import { mapProdutoRow } from './map-produto.drizzle.js';

function resolverProdutoPorCodigo(
  codigo: string,
  porSku: Map<string, ProdutoRecord>,
  porProdutoId: Map<string, ProdutoRecord>,
  porId: Map<string, ProdutoRecord>,
): ProdutoRecord | null {
  const normalizado = codigo.trim();
  if (!normalizado) {
    return null;
  }

  const porSkuMatch = porSku.get(normalizado);
  if (porSkuMatch) {
    return porSkuMatch;
  }

  const porProdutoIdMatch = porProdutoId.get(normalizado);
  if (porProdutoIdMatch) {
    return porProdutoIdMatch;
  }

  if (isProdutoUuid(normalizado)) {
    return porId.get(normalizado.toLowerCase()) ?? null;
  }

  return null;
}

export async function findProdutosByCodigosRemessaDb(
  db: DrizzleClient,
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

  const uuids = codigosNormalizados
    .filter((codigo) => isProdutoUuid(codigo))
    .map((codigo) => codigo.toLowerCase());

  const filtros = [
    inArray(produtos.sku, codigosNormalizados),
    inArray(produtos.produtoId, codigosNormalizados),
  ];

  if (uuids.length > 0) {
    filtros.push(inArray(produtos.id, uuids));
  }

  const rows = await db
    .select()
    .from(produtos)
    .where(or(...filtros));

  const porSku = new Map<string, ProdutoRecord>();
  const porProdutoId = new Map<string, ProdutoRecord>();
  const porId = new Map<string, ProdutoRecord>();

  for (const row of rows) {
    const produto = mapProdutoRow(row);
    porSku.set(produto.sku, produto);
    porProdutoId.set(produto.produtoId, produto);
    porId.set(produto.id, produto);
  }

  for (const codigo of codigosNormalizados) {
    resultado.set(
      codigo,
      resolverProdutoPorCodigo(codigo, porSku, porProdutoId, porId),
    );
  }

  return resultado;
}
