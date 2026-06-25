import { and, eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { equipeFuncionarios } from '../providers/drizzle/config/migrations/schema.js';

export async function removeEquipeFuncionarioDb(
  db: DrizzleClient,
  equipeId: string,
  funcionarioId: number,
): Promise<boolean> {
  const deleted = await db
    .delete(equipeFuncionarios)
    .where(
      and(
        eq(equipeFuncionarios.equipeId, equipeId),
        eq(equipeFuncionarios.funcionarioId, funcionarioId),
      ),
    )
    .returning({ id: equipeFuncionarios.id });

  return deleted.length > 0;
}
