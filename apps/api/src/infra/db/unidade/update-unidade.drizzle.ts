import { eq } from 'drizzle-orm';

import type { UpdateUnidadeInput } from '../../../domain/model/unidade/unidade.model.js';
import type { UnidadeRecord } from '../../../domain/repositories/unidade/unidade.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { unidades } from '../providers/drizzle/config/migrations/schema.js';
import { mapUnidadeRow } from './map-unidade.drizzle.js';

export async function updateUnidadeDb(
  db: DrizzleClient,
  id: string,
  data: UpdateUnidadeInput,
): Promise<UnidadeRecord | null> {
  const [record] = await db
    .update(unidades)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(unidades.id, id))
    .returning();

  if (!record) {
    return null;
  }

  return mapUnidadeRow(record);
}
