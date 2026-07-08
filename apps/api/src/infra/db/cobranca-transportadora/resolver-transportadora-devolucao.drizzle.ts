import { and, eq, ilike } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { transportes } from '../providers/drizzle/config/migrations/schema.js';
import { transportadoras } from '../providers/drizzle/config/migrations/schema.js';

export type TransportadoraDevolucaoResolvida = {
  transporteId: string | null;
  transportadoraId: string | null;
  transportadoraNome: string | null;
};

export async function resolverTransportadoraDevolucaoDb(
  db: DrizzleClient,
  unidadeId: string,
  transporteId: string | null,
): Promise<TransportadoraDevolucaoResolvida> {
  if (!transporteId) {
    return {
      transporteId: null,
      transportadoraId: null,
      transportadoraNome: null,
    };
  }

  const [transporteRow] = await db
    .select({
      transportadora: transportes.transportadora,
    })
    .from(transportes)
    .where(
      and(
        eq(transportes.numeroTransporte, transporteId),
        eq(transportes.unidadeId, unidadeId),
      ),
    )
    .limit(1);

  const transportadoraNome = transporteRow?.transportadora?.trim() ?? null;

  if (!transportadoraNome) {
    return {
      transporteId,
      transportadoraId: null,
      transportadoraNome: null,
    };
  }

  const [transportadoraRow] = await db
    .select({ id: transportadoras.id })
    .from(transportadoras)
    .where(
      and(
        eq(transportadoras.unidadeId, unidadeId),
        ilike(transportadoras.nome, transportadoraNome),
      ),
    )
    .limit(1);

  return {
    transporteId,
    transportadoraId: transportadoraRow?.id ?? null,
    transportadoraNome,
  };
}
