import { eq } from 'drizzle-orm';

import type { UpdatePerfilTarifaInput } from '../../../domain/model/perfil-tarifa/perfil-tarifa.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { perfisTarifas } from '../providers/drizzle/config/migrations/schema.js';
import { findPerfilTarifaByIdDb } from './find-perfil-tarifa.drizzle.js';
import { toPerfilTarifaUpdateValues } from './map-perfil-tarifa.drizzle.js';

export async function updatePerfilTarifaDb(
  db: DrizzleClient,
  id: string,
  data: UpdatePerfilTarifaInput,
) {
  const [record] = await db
    .update(perfisTarifas)
    .set(toPerfilTarifaUpdateValues(data))
    .where(eq(perfisTarifas.id, id))
    .returning();

  if (!record) {
    return null;
  }

  return findPerfilTarifaByIdDb(db, id);
}
