import { eq } from 'drizzle-orm';

import type { UpdateProdutoInput } from '../../../domain/model/produto/produto.model.js';
import type { ProdutoRecord } from '../../../domain/repositories/produto/produto.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { produtos } from '../providers/drizzle/config/migrations/schema.js';
import {
  mapProdutoRow,
  normalizeOptionalString,
} from './map-produto.drizzle.js';

export async function updateProdutoDb(
  db: DrizzleClient,
  produtoId: string,
  data: UpdateProdutoInput
): Promise<ProdutoRecord | null> {
  const patch: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.produtoId !== undefined) {
    patch.produtoId = data.produtoId.trim();
  }

  if (data.sku !== undefined) {
    patch.sku = data.sku.trim();
  }

  if (data.descricao !== undefined) {
    patch.descricao = data.descricao.trim();
  }

  if (data.empresa !== undefined) {
    patch.empresa = data.empresa;
  }

  if (data.categoria !== undefined) {
    patch.categoria = data.categoria;
  }

  if (data.grupo !== undefined) {
    patch.grupo = normalizeOptionalString(data.grupo);
  }

  if (data.tipo !== undefined) {
    patch.tipo = data.tipo;
  }

  if (data.ean !== undefined) {
    patch.ean = normalizeOptionalString(data.ean);
  }

  if (data.dum !== undefined) {
    patch.dum = normalizeOptionalString(data.dum);
  }

  if (data.shelfLife !== undefined) {
    patch.shelfLife = data.shelfLife;
  }

  if (data.pesoBrutoUnidade !== undefined) {
    patch.pesoBrutoUnidade = normalizeOptionalString(data.pesoBrutoUnidade);
  }

  if (data.pesoBrutoCaixa !== undefined) {
    patch.pesoBrutoCaixa = normalizeOptionalString(data.pesoBrutoCaixa);
  }

  if (data.pesoBrutoPalete !== undefined) {
    patch.pesoBrutoPalete = normalizeOptionalString(data.pesoBrutoPalete);
  }

  if (data.unidadesPorCaixa !== undefined) {
    patch.unidadesPorCaixa = data.unidadesPorCaixa;
  }

  if (data.caixasPorPalete !== undefined) {
    patch.caixasPorPalete = data.caixasPorPalete;
  }

  const [record] = await db
    .update(produtos)
    .set(patch)
    .where(eq(produtos.produtoId, produtoId))
    .returning();

  return record ? mapProdutoRow(record) : null;
}
