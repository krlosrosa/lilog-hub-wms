import { and, count, desc, eq, sql } from 'drizzle-orm';

import type { ListSessoesFilter } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  equipes,
  escalasTrabalho,
  sessaoFuncionarios,
  sessoesTrabalho,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapSessaoRow } from './map-sessao.drizzle.js';

export async function listSessoesTrabalhoDb(
  db: DrizzleClient,
  filter: ListSessoesFilter,
) {
  const conditions = [eq(sessoesTrabalho.unidadeId, filter.unidadeId)];

  if (filter.status) {
    conditions.push(eq(sessoesTrabalho.status, filter.status));
  }

  if (filter.dataReferencia) {
    conditions.push(eq(sessoesTrabalho.dataReferencia, filter.dataReferencia));
  }

  const where = and(...conditions);
  const offset = (filter.page - 1) * filter.limit;

  const [totalRow] = await db
    .select({ total: count() })
    .from(sessoesTrabalho)
    .where(where);

  const rows = await db
    .select({
      id: sessoesTrabalho.id,
      unidadeId: sessoesTrabalho.unidadeId,
      escalaId: sessoesTrabalho.escalaId,
      equipeId: sessoesTrabalho.equipeId,
      dataReferencia: sessoesTrabalho.dataReferencia,
      inicioPlanejado: sessoesTrabalho.inicioPlanejado,
      fimPlanejado: sessoesTrabalho.fimPlanejado,
      inicioReal: sessoesTrabalho.inicioReal,
      fimReal: sessoesTrabalho.fimReal,
      status: sessoesTrabalho.status,
      abertaPorUserId: sessoesTrabalho.abertaPorUserId,
      encerradaPorUserId: sessoesTrabalho.encerradaPorUserId,
      createdAt: sessoesTrabalho.createdAt,
      updatedAt: sessoesTrabalho.updatedAt,
      escalaNome: escalasTrabalho.nome,
      equipeNome: equipes.nome,
      horaInicioPlanejada: escalasTrabalho.horaInicioPlanejada,
      horaFimPlanejada: escalasTrabalho.horaFimPlanejada,
      cruzaMeiaNoite: escalasTrabalho.cruzaMeiaNoite,
      totalFuncionarios: sql<number>`coalesce(count(${sessaoFuncionarios.id}), 0)`,
    })
    .from(sessoesTrabalho)
    .innerJoin(escalasTrabalho, eq(sessoesTrabalho.escalaId, escalasTrabalho.id))
    .innerJoin(equipes, eq(sessoesTrabalho.equipeId, equipes.id))
    .leftJoin(
      sessaoFuncionarios,
      eq(sessaoFuncionarios.sessaoId, sessoesTrabalho.id),
    )
    .where(where)
    .groupBy(sessoesTrabalho.id, escalasTrabalho.id, equipes.id)
    .orderBy(desc(sessoesTrabalho.dataReferencia), desc(sessoesTrabalho.inicioPlanejado))
    .limit(filter.limit)
    .offset(offset);

  return {
    items: rows.map(mapSessaoRow),
    total: Number(totalRow?.total ?? 0),
    page: filter.page,
    limit: filter.limit,
  };
}
