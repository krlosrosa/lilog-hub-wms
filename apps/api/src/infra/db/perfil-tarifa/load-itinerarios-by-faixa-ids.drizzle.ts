import { asc, eq, inArray } from 'drizzle-orm';

import type { ItinerarioRecord } from '../../../domain/repositories/perfil-tarifa/perfil-tarifa.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  itinerarios,
  perfisTarifasFaixasKmItinerarios,
} from '../providers/drizzle/config/migrations/schema.js';

export async function loadItinerariosByFaixaIdsDb(
  db: DrizzleClient,
  faixaIds: string[],
): Promise<Map<string, ItinerarioRecord[]>> {
  if (faixaIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({
      faixaKmId: perfisTarifasFaixasKmItinerarios.faixaKmId,
      id: itinerarios.id,
      codigo: itinerarios.codigo,
    })
    .from(perfisTarifasFaixasKmItinerarios)
    .innerJoin(
      itinerarios,
      eq(perfisTarifasFaixasKmItinerarios.itinerarioId, itinerarios.id),
    )
    .where(inArray(perfisTarifasFaixasKmItinerarios.faixaKmId, faixaIds))
    .orderBy(asc(itinerarios.codigo));

  const grouped = new Map<string, ItinerarioRecord[]>();

  for (const row of rows) {
    const current = grouped.get(row.faixaKmId) ?? [];
    current.push({ id: row.id, codigo: row.codigo });
    grouped.set(row.faixaKmId, current);
  }

  return grouped;
}
