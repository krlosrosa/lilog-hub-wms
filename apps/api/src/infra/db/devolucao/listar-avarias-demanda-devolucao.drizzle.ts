import { and, eq } from 'drizzle-orm';

import type { DevolucaoAvariaDemandaRecord } from '../../../domain/repositories/devolucao/devolucao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasDevolucao,
  devolucaoAvarias,
  devolucaoItens,
} from '../providers/drizzle/config/migrations/schema.js';

export async function listarAvariasDemandaDevolucaoDb(
  db: DrizzleClient,
  demandaId: string,
  unidadeId: string,
): Promise<DevolucaoAvariaDemandaRecord[]> {
  const rows = await db
    .select({
      id: devolucaoAvarias.id,
      itemId: devolucaoAvarias.itemId,
      itemSku: devolucaoItens.sku,
      skusAfetados: devolucaoAvarias.skusAfetados,
      quantidadeCaixa: devolucaoAvarias.quantidadeCaixa,
      quantidadeUnidade: devolucaoAvarias.quantidadeUnidade,
    })
    .from(devolucaoAvarias)
    .innerJoin(
      demandasDevolucao,
      eq(devolucaoAvarias.demandaId, demandasDevolucao.id),
    )
    .leftJoin(devolucaoItens, eq(devolucaoAvarias.itemId, devolucaoItens.id))
    .where(
      and(
        eq(devolucaoAvarias.demandaId, demandaId),
        eq(demandasDevolucao.unidadeId, unidadeId),
      ),
    );

  return rows.map((row) => ({
    id: row.id,
    itemId: row.itemId,
    itemSku: row.itemSku,
    skusAfetados: row.skusAfetados,
    quantidadeCaixa: row.quantidadeCaixa ?? 0,
    quantidadeUnidade: row.quantidadeUnidade ?? 0,
  }));
}
