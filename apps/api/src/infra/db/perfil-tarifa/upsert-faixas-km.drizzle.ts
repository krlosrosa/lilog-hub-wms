import { eq } from 'drizzle-orm';

import type { UpsertFaixasKmInput } from '../../../domain/model/perfil-tarifa/perfil-tarifa.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  perfisTarifas,
  perfisTarifasFaixasKm,
  perfisTarifasFaixasKmItinerarios,
} from '../providers/drizzle/config/migrations/schema.js';
import { findOrCreateItinerariosDb } from '../transporte/find-or-create-itinerarios.drizzle.js';
import { findPerfilTarifaByIdDb } from './find-perfil-tarifa.drizzle.js';

export async function upsertFaixasKmDb(
  db: DrizzleClient,
  perfilTarifaId: string,
  data: UpsertFaixasKmInput,
) {
  const [perfil] = await db
    .select({ unidadeId: perfisTarifas.unidadeId })
    .from(perfisTarifas)
    .where(eq(perfisTarifas.id, perfilTarifaId))
    .limit(1);

  if (!perfil) {
    return null;
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(perfisTarifasFaixasKm)
      .where(eq(perfisTarifasFaixasKm.perfilTarifaId, perfilTarifaId));

    for (const faixa of data.faixas) {
      const itinerarios = await findOrCreateItinerariosDb(
        tx,
        perfil.unidadeId,
        faixa.itinerarios,
      );

      const [inserted] = await tx
        .insert(perfisTarifasFaixasKm)
        .values({
          perfilTarifaId,
          kmInicial: faixa.kmInicial.toFixed(2),
          kmFinal:
            faixa.kmFinal !== undefined && faixa.kmFinal !== null
              ? faixa.kmFinal.toFixed(2)
              : null,
          valor: faixa.valor.toFixed(2),
          itinerario: itinerarios[0]?.codigo ?? null,
        })
        .returning({ id: perfisTarifasFaixasKm.id });

      if (!inserted) {
        continue;
      }

      if (itinerarios.length > 0) {
        await tx.insert(perfisTarifasFaixasKmItinerarios).values(
          itinerarios.map((itinerario) => ({
            faixaKmId: inserted.id,
            itinerarioId: itinerario.id,
          })),
        );
      }
    }
  });

  return findPerfilTarifaByIdDb(db, perfilTarifaId);
}
