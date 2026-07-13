import { and, eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { cncItens } from '../providers/drizzle/config/migrations/schema.js';
import { mapCncItemRow } from './map-cnc.drizzle.js';

export async function removeCncItemDb(
  db: DrizzleClient,
  cncId: string,
  itemId: string,
) {
  const [row] = await db
    .delete(cncItens)
    .where(and(eq(cncItens.id, itemId), eq(cncItens.cncId, cncId)))
    .returning();

  return row ? mapCncItemRow(row) : null;
}
