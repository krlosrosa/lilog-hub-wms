import { and, eq, inArray } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { transportes } from '../providers/drizzle/config/migrations/schema.js';

export type TransporteDuplicadoRecord = {
  id: string;
  rota: string;
  status: string;
  ultimoMapaLoteId: string | null;
};

export async function findTransportesDuplicadosDb(
  db: DrizzleClient,
  input: {
    unidadeId: string;
    dataTransporte: string;
    rotas: string[];
  },
): Promise<TransporteDuplicadoRecord[]> {
  if (input.rotas.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: transportes.numeroTransporte,
      rota: transportes.numeroTransporte,
      status: transportes.status,
      ultimoMapaLoteId: transportes.ultimoMapaLoteId,
    })
    .from(transportes)
    .where(
      and(
        eq(transportes.unidadeId, input.unidadeId),
        eq(transportes.dataTransporte, input.dataTransporte),
        inArray(transportes.numeroTransporte, input.rotas),
      ),
    );

  return rows.map((row) => ({
    id: row.id,
    rota: row.rota,
    status: row.status,
    ultimoMapaLoteId: row.ultimoMapaLoteId,
  }));
}

export async function findTransportesComMapaExistenteDb(
  db: DrizzleClient,
  input: {
    unidadeId: string;
    transporteIds: string[];
  },
): Promise<TransporteDuplicadoRecord[]> {
  if (input.transporteIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: transportes.numeroTransporte,
      rota: transportes.numeroTransporte,
      status: transportes.status,
      ultimoMapaLoteId: transportes.ultimoMapaLoteId,
    })
    .from(transportes)
    .where(
      and(
        eq(transportes.unidadeId, input.unidadeId),
        inArray(transportes.numeroTransporte, input.transporteIds),
      ),
    );

  return rows
    .filter((row) => row.ultimoMapaLoteId != null)
    .map((row) => ({
      id: row.id,
      rota: row.rota,
      status: row.status,
      ultimoMapaLoteId: row.ultimoMapaLoteId,
    }));
}
