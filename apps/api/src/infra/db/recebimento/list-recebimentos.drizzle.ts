import { and, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';

import type { ListRecebimentosFilter } from '../../../domain/repositories/recebimento/recebimento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  preRecebimentos,
  recebimentos,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapRecebimentoRow } from './map-recebimento.drizzle.js';

export async function listRecebimentosDb(
  db: DrizzleClient,
  filter: ListRecebimentosFilter,
) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;
  const conditions: SQL[] = [];

  if (filter.unidadeId) {
    conditions.push(eq(preRecebimentos.unidadeId, filter.unidadeId));
  }

  if (filter.situacao) {
    if (filter.situacao === 'agendado' || filter.situacao === 'veiculo_chegou') {
      conditions.push(eq(preRecebimentos.situacao, filter.situacao));
    } else {
      conditions.push(eq(recebimentos.situacao, filter.situacao));
    }
  }

  if (filter.transportadoraId) {
    conditions.push(
      eq(preRecebimentos.transportadoraId, filter.transportadoraId),
    );
  }

  if (filter.responsavelId) {
    conditions.push(eq(recebimentos.responsavelId, filter.responsavelId));
  }

  if (filter.docaId) {
    conditions.push(eq(recebimentos.docaId, filter.docaId));
  }

  if (filter.dataInicio) {
    conditions.push(gte(recebimentos.dataInicio, filter.dataInicio));
  }

  if (filter.dataFim) {
    conditions.push(lte(recebimentos.dataInicio, filter.dataFim));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      recebimento: recebimentos,
      preRecebimento: preRecebimentos,
    })
    .from(recebimentos)
    .innerJoin(
      preRecebimentos,
      eq(recebimentos.preRecebimentoId, preRecebimentos.id),
    )
    .where(whereClause)
    .orderBy(desc(recebimentos.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(recebimentos)
    .innerJoin(
      preRecebimentos,
      eq(recebimentos.preRecebimentoId, preRecebimentos.id),
    )
    .where(whereClause);

  return {
    items: rows.map(({ recebimento, preRecebimento }) => ({
      ...mapRecebimentoRow(recebimento),
      unidadeId: preRecebimento.unidadeId,
      transportadoraId: preRecebimento.transportadoraId,
      placa: preRecebimento.placa,
      preRecebimentoSituacao: preRecebimento.situacao,
    })),
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  };
}
