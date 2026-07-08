import { and, asc, eq } from 'drizzle-orm';

import type { DevolucaoAvariaDetalheRecord } from '../../../domain/repositories/devolucao/devolucao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasDevolucao,
  devolucaoAvarias,
  devolucaoItens,
} from '../providers/drizzle/config/migrations/schema.js';

export async function listarAvariasDetalheDemandaDb(
  db: DrizzleClient,
  demandaId: string,
  unidadeId: string,
): Promise<DevolucaoAvariaDetalheRecord[]> {
  const rows = await db
    .select({
      id: devolucaoAvarias.id,
      demandaId: devolucaoAvarias.demandaId,
      itemId: devolucaoAvarias.itemId,
      itemSku: devolucaoItens.sku,
      tipo: devolucaoAvarias.tipo,
      natureza: devolucaoAvarias.natureza,
      causa: devolucaoAvarias.causa,
      quantidadeCaixa: devolucaoAvarias.quantidadeCaixa,
      quantidadeUnidade: devolucaoAvarias.quantidadeUnidade,
      skusAfetados: devolucaoAvarias.skusAfetados,
      observacao: devolucaoAvarias.observacao,
      photoUrls: devolucaoAvarias.photoUrls,
      createdAt: devolucaoAvarias.createdAt,
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
    )
    .orderBy(asc(devolucaoAvarias.createdAt));

  return rows.map((row) => ({
    id: row.id,
    demandaId: row.demandaId,
    itemId: row.itemId,
    itemSku: row.itemSku,
    tipo: row.tipo,
    natureza: row.natureza,
    causa: row.causa,
    quantidadeCaixa: row.quantidadeCaixa ?? 0,
    quantidadeUnidade: row.quantidadeUnidade ?? 0,
    skusAfetados: row.skusAfetados,
    observacao: row.observacao,
    photoUrls: row.photoUrls ?? [],
    createdAt: row.createdAt,
  }));
}
