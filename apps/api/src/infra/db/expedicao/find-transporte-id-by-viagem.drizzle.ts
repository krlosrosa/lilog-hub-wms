import { and, eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { transportes } from '../providers/drizzle/config/migrations/schema.js';

export async function findTransporteIdByViagemDb(
  db: DrizzleClient,
  viagemId: number,
  unidadeId: string,
): Promise<string | null> {
  const rows = await db
    .select({ id: transportes.numeroTransporte })
    .from(transportes)
    .where(
      and(
        eq(transportes.viagemId, viagemId),
        eq(transportes.unidadeId, unidadeId),
      ),
    )
    .limit(1);

  return rows[0]?.id ?? null;
}
