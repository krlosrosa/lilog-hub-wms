import { eq } from 'drizzle-orm';

import type { AtualizarPerfilPlacaInput } from '../../../domain/repositories/placa-transportadora/placa-transportadora.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { transportadoraPlacas } from '../providers/drizzle/config/migrations/schema.js';
import { findPlacaTransportadoraByIdDb } from './find-placa-transportadora-by-id.drizzle.js';

export async function atualizarPerfilPlacaDb(
  db: DrizzleClient,
  data: AtualizarPerfilPlacaInput,
) {
  const updated = await db
    .update(transportadoraPlacas)
    .set({
      perfilTarifaId: data.perfilTarifaId,
      updatedAt: new Date(),
    })
    .where(eq(transportadoraPlacas.id, data.placaId))
    .returning({ id: transportadoraPlacas.id });

  if (!updated.length) {
    return null;
  }

  return findPlacaTransportadoraByIdDb(db, data.placaId);
}
