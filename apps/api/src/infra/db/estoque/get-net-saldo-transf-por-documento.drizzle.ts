import { and, eq, or } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { movimentacoesEstoque } from '../providers/drizzle/config/migrations/schema.js';
import { toQuantityNumber } from './map-estoque.drizzle.js';

export type NetSaldoTransfPorProduto = {
  produtoId: string;
  quantidade: number;
  unidadeMedida: string;
  lote: string;
  validade: Date | null;
  numeroSerie: string;
};

export async function getNetSaldoTransfPorDocumentoDb(
  db: DrizzleClient,
  unidadeId: string,
  depositoTransfId: string,
  documentoRef: string,
): Promise<NetSaldoTransfPorProduto[]> {
  const movimentos = await db
    .select()
    .from(movimentacoesEstoque)
    .where(
      and(
        eq(movimentacoesEstoque.unidadeId, unidadeId),
        eq(movimentacoesEstoque.documentoRef, documentoRef),
        or(
          eq(movimentacoesEstoque.depositoDestinoId, depositoTransfId),
          eq(movimentacoesEstoque.depositoOrigemId, depositoTransfId),
        ),
      ),
    );

  const map = new Map<string, NetSaldoTransfPorProduto>();

  for (const movimento of movimentos) {
    const qty = toQuantityNumber(movimento.quantidade);
    const lote = movimento.lote ?? '';
    const numeroSerie = movimento.numeroSerie ?? '';
    const key = `${movimento.produtoId}:${lote}:${numeroSerie}`;
    const current = map.get(key) ?? {
      produtoId: movimento.produtoId,
      quantidade: 0,
      unidadeMedida: movimento.unidadeMedida,
      lote,
      validade: movimento.validade,
      numeroSerie,
    };

    if (movimento.depositoDestinoId === depositoTransfId) {
      current.quantidade += qty;
    }

    if (movimento.depositoOrigemId === depositoTransfId) {
      current.quantidade -= qty;
    }

    map.set(key, current);
  }

  return [...map.values()].filter((item) => item.quantidade > 0);
}
