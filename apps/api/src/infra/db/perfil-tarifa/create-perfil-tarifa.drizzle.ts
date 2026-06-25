import type { CreatePerfilTarifaInput } from '../../../domain/model/perfil-tarifa/perfil-tarifa.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { perfisTarifas } from '../providers/drizzle/config/migrations/schema.js';
import { findPerfilTarifaByIdDb } from './find-perfil-tarifa.drizzle.js';
import { toPerfilTarifaInsertValues } from './map-perfil-tarifa.drizzle.js';

export async function createPerfilTarifaDb(
  db: DrizzleClient,
  data: CreatePerfilTarifaInput,
) {
  const [record] = await db
    .insert(perfisTarifas)
    .values(toPerfilTarifaInsertValues(data))
    .returning();

  if (!record) {
    throw new Error('Failed to create perfil tarifa');
  }

  const created = await findPerfilTarifaByIdDb(db, record.id);

  if (!created) {
    throw new Error('Failed to load created perfil tarifa');
  }

  return created;
}
