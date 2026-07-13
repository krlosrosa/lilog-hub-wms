import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { usuarioUnidades } from '../providers/drizzle/config/migrations/schema.js';

export async function syncUserUnidadesDb(
  db: DrizzleClient,
  userId: number,
  unidadeIds: string[],
): Promise<void> {
  const uniqueUnidadeIds = [...new Set(unidadeIds.map((id) => id.trim()).filter(Boolean))];

  await db.transaction(async (tx) => {
    await tx
      .delete(usuarioUnidades)
      .where(eq(usuarioUnidades.userId, userId));

    if (uniqueUnidadeIds.length === 0) {
      return;
    }

    await tx.insert(usuarioUnidades).values(
      uniqueUnidadeIds.map((unidadeId) => ({
        userId,
        unidadeId,
      })),
    );
  });
}
