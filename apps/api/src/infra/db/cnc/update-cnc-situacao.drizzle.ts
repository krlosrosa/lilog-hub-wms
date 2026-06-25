import { eq } from 'drizzle-orm';

import type { UpdateCncSituacaoInput } from '../../../domain/repositories/cnc/cnc.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { naoConformidades } from '../providers/drizzle/config/migrations/schema.js';
import { mapCncRow, toCncSituacaoUpdateValues } from './map-cnc.drizzle.js';

export async function updateCncSituacaoDb(
  db: DrizzleClient,
  id: string,
  data: UpdateCncSituacaoInput,
) {
  const [row] = await db
    .update(naoConformidades)
    .set(toCncSituacaoUpdateValues(data))
    .where(eq(naoConformidades.id, id))
    .returning();

  return row ? mapCncRow(row) : null;
}
