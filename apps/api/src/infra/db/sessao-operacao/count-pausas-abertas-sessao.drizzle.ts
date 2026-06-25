import { and, eq, isNull, sql } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  sessaoFuncionarioPausas,
  sessaoFuncionarios,
} from '../providers/drizzle/config/migrations/schema.js';

export async function countPausasAbertasBySessaoIdDb(
  db: DrizzleClient,
  sessaoId: string,
): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
    })
    .from(sessaoFuncionarioPausas)
    .innerJoin(
      sessaoFuncionarios,
      eq(sessaoFuncionarioPausas.sessaoFuncionarioId, sessaoFuncionarios.id),
    )
    .where(
      and(
        eq(sessaoFuncionarios.sessaoId, sessaoId),
        isNull(sessaoFuncionarioPausas.fim),
      ),
    );

  return row?.total ?? 0;
}
