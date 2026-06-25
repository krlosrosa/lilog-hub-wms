import { and, eq, inArray, sql } from 'drizzle-orm';

import type { UserUnidadeRecord } from '../../../domain/repositories/user/user.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  funcionarios,
  unidades,
} from '../providers/drizzle/config/migrations/schema.js';

import { findUserByIdDb } from './find-user.drizzle.js';

export async function listUserAccessibleUnidadesDb(
  db: DrizzleClient,
  userId: number,
): Promise<UserUnidadeRecord[]> {
  const user = await findUserByIdDb(db, userId);

  if (!user) {
    return [];
  }

  if (user.role === 'admin') {
    const rows = await db
      .select({
        id: unidades.id,
        nome: unidades.nome,
        nomeFilial: unidades.nomeFilial,
        cluster: unidades.cluster,
      })
      .from(unidades)
      .orderBy(unidades.nome);

    return rows;
  }

  const unidadeIds = new Set<string>();

  if (user.unidadeId) {
    unidadeIds.add(user.unidadeId);
  }

  const funcionarioRows = await db
    .select({ unidadeId: funcionarios.unidadeId })
    .from(funcionarios)
    .where(
      and(
        eq(funcionarios.situacao, 'ativo'),
        sql`lower(${funcionarios.email}) = ${user.email.toLowerCase()}`,
      ),
    );

  for (const row of funcionarioRows) {
    unidadeIds.add(row.unidadeId);
  }

  if (unidadeIds.size === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: unidades.id,
      nome: unidades.nome,
      nomeFilial: unidades.nomeFilial,
      cluster: unidades.cluster,
    })
    .from(unidades)
    .where(inArray(unidades.id, [...unidadeIds]))
    .orderBy(unidades.nome);

  return rows;
}
