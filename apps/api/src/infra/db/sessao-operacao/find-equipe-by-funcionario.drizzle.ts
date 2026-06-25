import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  equipeFuncionarios,
  equipes,
} from '../providers/drizzle/config/migrations/schema.js';

export async function findEquipeIdByFuncionarioIdDb(
  db: DrizzleClient,
  funcionarioId: number,
): Promise<string | null> {
  const [row] = await db
    .select({ equipeId: equipeFuncionarios.equipeId })
    .from(equipeFuncionarios)
    .innerJoin(equipes, eq(equipeFuncionarios.equipeId, equipes.id))
    .where(eq(equipeFuncionarios.funcionarioId, funcionarioId))
    .limit(1);

  return row?.equipeId ?? null;
}
