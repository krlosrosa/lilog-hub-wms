import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { itensArmazenagem } from '../providers/drizzle/config/migrations/schema.js';
import { mapItemArmazenagemRow } from './map-armazenagem.drizzle.js';

export async function updateEnderecoSugeridoItemArmazenagemDb(
  db: DrizzleClient,
  id: string,
  enderecoSugeridoId: string,
) {
  const [record] = await db
    .update(itensArmazenagem)
    .set({
      enderecoSugeridoId,
      updatedAt: new Date(),
    })
    .where(eq(itensArmazenagem.id, id))
    .returning();

  return record ? mapItemArmazenagemRow(record) : null;
}
