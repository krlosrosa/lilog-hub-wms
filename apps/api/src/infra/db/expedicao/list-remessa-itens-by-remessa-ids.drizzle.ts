import { asc, eq, inArray, sql, type SQLWrapper } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  produtos,
  remessaItens,
} from '../providers/drizzle/config/migrations/schema.js';

const produtoPorProdutoId = alias(produtos, 'produto_por_produto_id');
const produtoPorSku = alias(produtos, 'produto_por_sku');

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
        produtoPorSku.produtoId,
      ),
      produtoCodigo: coalesce<string>(
        produtoPorProdutoId.produtoId,
        produtoPorSku.produtoId,
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
        produtoPorProdutoId.empresa,
        produtoPorSku.empresa,
      ),
      categoriaProduto: coalesce<string | null>(
        produtoPorProdutoId.categoria,
        produtoPorSku.categoria,
      ),
      unidadesPorCaixa: coalesce<number | null>(
        produtoPorProdutoId.unidadesPorCaixa,
        produtoPorSku.unidadesPorCaixa,
      ),
      caixasPorPalete: coalesce<number | null>(
        produtoPorProdutoId.caixasPorPalete,
        produtoPorSku.caixasPorPalete,
      ),
      pesoBrutoUnidade: coalesce<string | null>(
        produtoPorProdutoId.pesoBrutoUnidade,
        produtoPorSku.pesoBrutoUnidade,
      ),
      pesoBrutoCaixa: coalesce<string | null>(
        produtoPorProdutoId.pesoBrutoCaixa,
        produtoPorSku.pesoBrutoCaixa,
      ),
      pesoBrutoPalete: coalesce<string | null>(
        produtoPorProdutoId.pesoBrutoPalete,
        produtoPorSku.pesoBrutoPalete,
      ),
      pesoLiquidoUnidade: coalesce<string | null>(
        produtoPorProdutoId.pesoLiquidoUnidade,
        produtoPorSku.pesoLiquidoUnidade,
      ),
      pesoLiquidoCaixa: coalesce<string | null>(
        produtoPorProdutoId.pesoLiquidoCaixa,
        produtoPorSku.pesoLiquidoCaixa,
      ),
      pesoLiquidoPalete: coalesce<string | null>(
        produtoPorProdutoId.pesoLiquidoPalete,
        produtoPorSku.pesoLiquidoPalete,
      ),
      descricaoProduto: coalesce<string | null>(
        produtoPorProdutoId.descricao,
        produtoPorSku.descricao,
      ),
    })
    .from(remessaItens)
    .leftJoin(
      produtoPorProdutoId,
      eq(remessaItens.produtoId, produtoPorProdutoId.produtoId),
    )
    .leftJoin(produtoPorSku, eq(sql`trim(${remessaItens.sku})`, produtoPorSku.sku))
    .where(inArray(remessaItens.remessaId, remessaIds))
    .orderBy(asc(remessaItens.remessaId), asc(remessaItens.sku));
}
