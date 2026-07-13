import { eq } from 'drizzle-orm';

import type { UpdateObservacaoCncInput } from '../../../domain/repositories/cnc/cnc.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { naoConformidades } from '../providers/drizzle/config/migrations/schema.js';
import { mapCncRow } from './map-cnc.drizzle.js';

export async function updateObservacaoCncDb(
  db: DrizzleClient,
  id: string,
  data: UpdateObservacaoCncInput,
) {
  const [row] = await db
    .update(naoConformidades)
    .set({
      observacao: data.observacao,
      updatedAt: new Date(),
    })
    .where(eq(naoConformidades.id, id))
    .returning();

  return row ? mapCncRow(row) : null;
}
