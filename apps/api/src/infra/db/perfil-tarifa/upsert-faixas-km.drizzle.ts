import { eq } from 'drizzle-orm';

import type { UpsertFaixasKmInput } from '../../../domain/model/perfil-tarifa/perfil-tarifa.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { perfisTarifasFaixasKm } from '../providers/drizzle/config/migrations/schema.js';
import { findPerfilTarifaByIdDb } from './find-perfil-tarifa.drizzle.js';

export async function upsertFaixasKmDb(
  db: DrizzleClient,
  perfilTarifaId: string,
  data: UpsertFaixasKmInput,
) {
  await db.transaction(async (tx) => {
    await tx
      .delete(perfisTarifasFaixasKm)
      .where(eq(perfisTarifasFaixasKm.perfilTarifaId, perfilTarifaId));

    await tx.insert(perfisTarifasFaixasKm).values(
      data.faixas.map((faixa) => ({
        perfilTarifaId,
        kmInicial: faixa.kmInicial.toFixed(2),
        kmFinal:
          faixa.kmFinal !== undefined && faixa.kmFinal !== null
            ? faixa.kmFinal.toFixed(2)
            : null,
        valor: faixa.valor.toFixed(2),
        itinerario: faixa.itinerario?.trim() ?? null,
      })),
    );
  });

  return findPerfilTarifaByIdDb(db, perfilTarifaId);
}
