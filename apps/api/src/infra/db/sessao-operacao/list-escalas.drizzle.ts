import { and, count, eq, sql } from 'drizzle-orm';

import type {
  ListEscalasFilter,
  ListEscalasResult,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  equipeFuncionarios,
  equipes,
  escalasTrabalho,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapEscalaRow } from './map-escala.drizzle.js';

export async function listEscalasDb(
  db: DrizzleClient,
  filter: ListEscalasFilter,
): Promise<ListEscalasResult> {
  const where = eq(escalasTrabalho.unidadeId, filter.unidadeId);
  const offset = (filter.page - 1) * filter.limit;

  const [totalRow] = await db
    .select({ total: count() })
    .from(escalasTrabalho)
    .where(where);

  const rows = await db
    .select({
      id: escalasTrabalho.id,
      unidadeId: escalasTrabalho.unidadeId,
      equipeId: escalasTrabalho.equipeId,
      nome: escalasTrabalho.nome,
      horaInicioPlanejada: escalasTrabalho.horaInicioPlanejada,
      horaFimPlanejada: escalasTrabalho.horaFimPlanejada,
      cruzaMeiaNoite: escalasTrabalho.cruzaMeiaNoite,
      ativo: escalasTrabalho.ativo,
      createdAt: escalasTrabalho.createdAt,
      updatedAt: escalasTrabalho.updatedAt,
      equipeNome: equipes.nome,
      equipeArea: equipes.area,
      totalFuncionarios: sql<number>`coalesce(count(${equipeFuncionarios.id}), 0)`,
    })
    .from(escalasTrabalho)
    .innerJoin(equipes, eq(escalasTrabalho.equipeId, equipes.id))
    .leftJoin(
      equipeFuncionarios,
      eq(equipeFuncionarios.equipeId, escalasTrabalho.equipeId),
    )
    .where(where)
    .groupBy(
      escalasTrabalho.id,
      equipes.id,
    )
    .orderBy(sql`${escalasTrabalho.nome} asc`)
    .limit(filter.limit)
    .offset(offset);

  return {
    items: rows.map(mapEscalaRow),
    total: Number(totalRow?.total ?? 0),
    page: filter.page,
    limit: filter.limit,
  };
}
