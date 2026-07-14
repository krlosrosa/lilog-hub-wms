import { and, eq, inArray } from 'drizzle-orm';

import type { UserUnidadeRecord } from '../../../domain/repositories/user/user.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  funcionarios,
  unidades,
  usuarioUnidades,
} from '../providers/drizzle/config/migrations/schema.js';

import { findUserByIdDb } from './find-user.drizzle.js';

async function resolveUnidadeIdsForUser(
  db: DrizzleClient,
  userId: number,
  user: NonNullable<Awaited<ReturnType<typeof findUserByIdDb>>>,
): Promise<string[]> {
  const explicitRows = await db
    .select({ unidadeId: usuarioUnidades.unidadeId })
    .from(usuarioUnidades)
    .where(eq(usuarioUnidades.userId, userId));

  if (explicitRows.length > 0) {
    return [...new Set(explicitRows.map((row) => row.unidadeId))];
  }

  const unidadeIds = new Set<string>();

  if (user.unidadeId) {
    unidadeIds.add(user.unidadeId);
  }

  if (user.funcionarioId != null) {
    const [funcionarioRow] = await db
      .select({ unidadeId: funcionarios.unidadeId })
      .from(funcionarios)
      .where(
        and(
          eq(funcionarios.id, user.funcionarioId),
          eq(funcionarios.situacao, 'ativo'),
        ),
      )
      .limit(1);

    if (funcionarioRow) {
      unidadeIds.add(funcionarioRow.unidadeId);
    }
  }

  return [...unidadeIds];
}

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

  const unidadeIds = await resolveUnidadeIdsForUser(db, userId, user);

  if (unidadeIds.length === 0) {
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
    .where(inArray(unidades.id, unidadeIds))
    .orderBy(unidades.nome);

  return rows;
}
