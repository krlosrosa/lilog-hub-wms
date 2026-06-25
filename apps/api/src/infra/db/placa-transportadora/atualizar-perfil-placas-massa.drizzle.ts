import { inArray } from 'drizzle-orm';

import type { AtualizarPerfilPlacasMassaInput } from '../../../domain/repositories/placa-transportadora/placa-transportadora.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { transportadoraPlacas } from '../providers/drizzle/config/migrations/schema.js';

export async function atualizarPerfilPlacasMassaDb(
  db: DrizzleClient,
  data: AtualizarPerfilPlacasMassaInput,
) {
  if (data.placaIds.length === 0) {
    return { atualizadas: 0 };
  }

  const updated = await db
    .update(transportadoraPlacas)
    .set({
      perfilTarifaId: data.perfilTarifaId,
      updatedAt: new Date(),
    })
    .where(inArray(transportadoraPlacas.id, data.placaIds))
    .returning({ id: transportadoraPlacas.id });

  return { atualizadas: updated.length };
}
