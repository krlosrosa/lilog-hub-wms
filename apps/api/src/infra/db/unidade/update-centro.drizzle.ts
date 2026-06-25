import { and, eq } from 'drizzle-orm';

import type { UpdateCentroInput } from '../../../domain/model/unidade/unidade.model.js';
import type { CentroRecord } from '../../../domain/repositories/unidade/unidade.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { centros } from '../providers/drizzle/config/migrations/schema.js';
import { mapCentroRow } from './map-unidade.drizzle.js';

export async function updateCentroDb(
  db: DrizzleClient,
  centroId: string,
  unidadeId: string,
  data: UpdateCentroInput,
): Promise<CentroRecord | null> {
  const [record] = await db
    .update(centros)
    .set(data)
    .where(and(eq(centros.id, centroId), eq(centros.unidadeId, unidadeId)))
    .returning();

  if (!record) {
    return null;
  }

  return mapCentroRow(record);
}
