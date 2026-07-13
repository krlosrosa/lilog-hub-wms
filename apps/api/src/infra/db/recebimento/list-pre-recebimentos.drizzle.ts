import { and, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';

import type { ListPreRecebimentosFilter } from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  preRecebimentos,
} from '../providers/drizzle/config/schemas/recebimento.schema.js';
import { mapPreRecebimentoRow } from './map-recebimento.drizzle.js';

export async function listPreRecebimentosDb(
  db: DrizzleClient,
  filter: ListPreRecebimentosFilter,
) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;
  const conditions: SQL[] = [];

  if (filter.unidadeId) {
    conditions.push(eq(preRecebimentos.unidadeId, filter.unidadeId));
  }

  if (filter.situacao) {
    conditions.push(eq(preRecebimentos.situacao, filter.situacao));
  }

  if (filter.transportadoraNome) {
    conditions.push(
      eq(preRecebimentos.transportadoraNome, filter.transportadoraNome),
    );
  }

  if (filter.dataInicio) {
    conditions.push(gte(preRecebimentos.horarioPrevisto, filter.dataInicio));
  }

  if (filter.dataFim) {
    conditions.push(lte(preRecebimentos.horarioPrevisto, filter.dataFim));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      preRecebimento: preRecebimentos,
    })
    .from(preRecebimentos)
    .where(whereClause)
    .orderBy(desc(preRecebimentos.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(preRecebimentos)
    .where(whereClause);

  return {
    items: rows.map(({ preRecebimento }) => mapPreRecebimentoRow(preRecebimento)),
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  };
}
