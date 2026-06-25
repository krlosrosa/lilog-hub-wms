import { and, eq } from 'drizzle-orm';

import type { TransporteViagemRavexRecord } from '../../../domain/repositories/expedicao/transporte.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { transportes } from '../providers/drizzle/config/migrations/schema.js';

export async function findTransporteViagemRavexDb(
  db: DrizzleClient,
  transporteId: string,
  unidadeId: string,
): Promise<TransporteViagemRavexRecord | null> {
  const rows = await db
    .select({
      id: transportes.id,
      unidadeId: transportes.unidadeId,
      rota: transportes.rota,
      viagemId: transportes.viagemId,
      viagemInicioEm: transportes.viagemInicioEm,
      viagemFimEm: transportes.viagemFimEm,
      anomalia: transportes.anomalia,
    })
    .from(transportes)
    .where(
      and(
        eq(transportes.id, transporteId),
        eq(transportes.unidadeId, unidadeId),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return row;
}
