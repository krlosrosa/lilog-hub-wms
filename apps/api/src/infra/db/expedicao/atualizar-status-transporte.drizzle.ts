import { and, eq } from 'drizzle-orm';

import type { StatusTransporteOperacional } from '../../../domain/repositories/expedicao/transporte.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { transportes } from '../providers/drizzle/config/migrations/schema.js';

export async function findStatusTransporteDb(
  db: DrizzleClient,
  transporteId: string,
  unidadeId: string,
): Promise<{ id: string; status: StatusTransporteOperacional } | null> {
  const rows = await db
    .select({
      id: transportes.id,
      status: transportes.status,
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

  return {
    id: row.id,
    status: row.status as StatusTransporteOperacional,
  };
}

export async function atualizarStatusTransporteDb(
  db: DrizzleClient,
  input: {
    transporteId: string;
    unidadeId: string;
    status: StatusTransporteOperacional;
  },
): Promise<{ id: string; status: StatusTransporteOperacional } | null> {
  const rows = await db
    .update(transportes)
    .set({
      status: input.status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(transportes.id, input.transporteId),
        eq(transportes.unidadeId, input.unidadeId),
      ),
    )
    .returning({
      id: transportes.id,
      status: transportes.status,
    });

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    status: row.status as StatusTransporteOperacional,
  };
}
