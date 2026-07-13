import { and, eq } from 'drizzle-orm';

import type { UpdateCncItemInput } from '../../../domain/repositories/cnc/cnc.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { cncItens } from '../providers/drizzle/config/migrations/schema.js';
import { mapCncItemRow, toCncItemUpdateValues } from './map-cnc.drizzle.js';

export async function updateCncItemDb(
  db: DrizzleClient,
  cncId: string,
  itemId: string,
  data: UpdateCncItemInput,
) {
  const [row] = await db
    .update(cncItens)
    .set(toCncItemUpdateValues(data))
    .where(and(eq(cncItens.id, itemId), eq(cncItens.cncId, cncId)))
    .returning();

  return row ? mapCncItemRow(row) : null;
}
