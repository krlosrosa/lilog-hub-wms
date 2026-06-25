import { asc, eq, inArray, sql, type SQLWrapper } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  produtos,
  remessaItens,
} from '../providers/drizzle/config/migrations/schema.js';

const produtoPorId = alias(produtos, 'produto_por_id');
const produtoPorSku = alias(produtos, 'produto_por_sku');
const produtoPorCodigo = alias(produtos, 'produto_por_codigo');
const produtoPorUuid = alias(produtos, 'produto_por_uuid');

function coalesce<T>(...parts: SQLWrapper[]) {
  return sql<T>`coalesce(${sql.join(parts, sql`, `)})`;
}

export type RemessaItemComProdutoRow = {
  id: string;
  remessaId: string;
  sku: string;
  produtoId: string | null;
  produtoIdResolvido: string | null;
  produtoCodigo: string;
  lote: string | null;
  dataFabricacao: string | null;
  faixa: string | null;
  peso: string | null;
  quantidade: string | null;
  unidadeMedida: string;
  quantidadeNormalizadaUnidades: string | null;
  empresaProduto: string | null;
  categoriaProduto: string | null;
  unidadesPorCaixa: number | null;
  caixasPorPalete: number | null;
  pesoBrutoUnidade: string | null;
  pesoBrutoCaixa: string | null;
  pesoBrutoPalete: string | null;
  pesoLiquidoUnidade: string | null;
  pesoLiquidoCaixa: string | null;
  pesoLiquidoPalete: string | null;
  descricaoProduto: string | null;
};

export async function listRemessaItensByRemessaIdsDb(
  db: DrizzleClient,
  remessaIds: string[],
): Promise<RemessaItemComProdutoRow[]> {
  if (remessaIds.length === 0) {
    return [];
  }

  return db
    .select({
      id: remessaItens.id,
      remessaId: remessaItens.remessaId,
      sku: remessaItens.sku,
      produtoId: remessaItens.produtoId,
      produtoIdResolvido: coalesce<string | null>(
        remessaItens.produtoId,
        produtoPorSku.id,
        produtoPorCodigo.id,
        produtoPorUuid.id,
      ),
      produtoCodigo: coalesce<string>(
        produtoPorSku.produtoId,
        produtoPorCodigo.produtoId,
        produtoPorUuid.produtoId,
        produtoPorSku.sku,
        produtoPorUuid.sku,
        remessaItens.sku,
      ),
      lote: remessaItens.lote,
      dataFabricacao: remessaItens.dataFabricacao,
      faixa: remessaItens.faixa,
      peso: remessaItens.peso,
      quantidade: remessaItens.quantidade,
      unidadeMedida: remessaItens.unidadeMedida,
      quantidadeNormalizadaUnidades: remessaItens.quantidadeNormalizadaUnidades,
      empresaProduto: coalesce<string | null>(
        produtoPorId.empresa,
        produtoPorSku.empresa,
        produtoPorCodigo.empresa,
        produtoPorUuid.empresa,
      ),
      categoriaProduto: coalesce<string | null>(
        produtoPorId.categoria,
        produtoPorSku.categoria,
        produtoPorCodigo.categoria,
        produtoPorUuid.categoria,
      ),
      unidadesPorCaixa: coalesce<number | null>(
        produtoPorId.unidadesPorCaixa,
        produtoPorSku.unidadesPorCaixa,
        produtoPorCodigo.unidadesPorCaixa,
        produtoPorUuid.unidadesPorCaixa,
      ),
      caixasPorPalete: coalesce<number | null>(
        produtoPorId.caixasPorPalete,
        produtoPorSku.caixasPorPalete,
        produtoPorCodigo.caixasPorPalete,
        produtoPorUuid.caixasPorPalete,
      ),
      pesoBrutoUnidade: coalesce<string | null>(
        produtoPorId.pesoBrutoUnidade,
        produtoPorSku.pesoBrutoUnidade,
        produtoPorCodigo.pesoBrutoUnidade,
        produtoPorUuid.pesoBrutoUnidade,
      ),
      pesoBrutoCaixa: coalesce<string | null>(
        produtoPorId.pesoBrutoCaixa,
        produtoPorSku.pesoBrutoCaixa,
        produtoPorCodigo.pesoBrutoCaixa,
        produtoPorUuid.pesoBrutoCaixa,
      ),
      pesoBrutoPalete: coalesce<string | null>(
        produtoPorId.pesoBrutoPalete,
        produtoPorSku.pesoBrutoPalete,
        produtoPorCodigo.pesoBrutoPalete,
        produtoPorUuid.pesoBrutoPalete,
      ),
      pesoLiquidoUnidade: coalesce<string | null>(
        produtoPorId.pesoLiquidoUnidade,
        produtoPorSku.pesoLiquidoUnidade,
        produtoPorCodigo.pesoLiquidoUnidade,
        produtoPorUuid.pesoLiquidoUnidade,
      ),
      pesoLiquidoCaixa: coalesce<string | null>(
        produtoPorId.pesoLiquidoCaixa,
        produtoPorSku.pesoLiquidoCaixa,
        produtoPorCodigo.pesoLiquidoCaixa,
        produtoPorUuid.pesoLiquidoCaixa,
      ),
      pesoLiquidoPalete: coalesce<string | null>(
        produtoPorId.pesoLiquidoPalete,
        produtoPorSku.pesoLiquidoPalete,
        produtoPorCodigo.pesoLiquidoPalete,
        produtoPorUuid.pesoLiquidoPalete,
      ),
      descricaoProduto: coalesce<string | null>(
        produtoPorId.descricao,
        produtoPorSku.descricao,
        produtoPorCodigo.descricao,
        produtoPorUuid.descricao,
      ),
    })
    .from(remessaItens)
    .leftJoin(produtoPorId, eq(remessaItens.produtoId, produtoPorId.id))
    .leftJoin(produtoPorSku, eq(sql`trim(${remessaItens.sku})`, produtoPorSku.sku))
    .leftJoin(
      produtoPorCodigo,
      eq(sql`trim(${remessaItens.sku})`, produtoPorCodigo.produtoId),
    )
    .leftJoin(
      produtoPorUuid,
      sql`trim(${remessaItens.sku}) = ${produtoPorUuid.id}::text`,
    )
    .where(inArray(remessaItens.remessaId, remessaIds))
    .orderBy(asc(remessaItens.remessaId), asc(remessaItens.sku));
}
