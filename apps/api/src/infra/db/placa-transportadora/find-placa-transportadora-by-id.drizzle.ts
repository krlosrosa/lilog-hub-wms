import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  perfisTarifas,
  transportadoraPlacas,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapPlacaTransportadoraRow } from './map-placa-transportadora.drizzle.js';

export async function findPlacaTransportadoraByIdDb(
  db: DrizzleClient,
  id: string,
) {
  const rows = await db
    .select({
      placa: transportadoraPlacas,
      perfilTarifaNome: perfisTarifas.nome,
    })
    .from(transportadoraPlacas)
    .leftJoin(
      perfisTarifas,
      eq(transportadoraPlacas.perfilTarifaId, perfisTarifas.id),
    )
    .where(eq(transportadoraPlacas.id, id))
    .limit(1);

  const row = rows[0];

  if (!row) {
    return null;
  }

  return mapPlacaTransportadoraRow(row.placa, row.perfilTarifaNome);
}
