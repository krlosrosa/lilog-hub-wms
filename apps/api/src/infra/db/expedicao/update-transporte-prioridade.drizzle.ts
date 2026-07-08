import { and, eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { transportes } from '../providers/drizzle/config/migrations/schema.js';

export type NivelPrioridadeTransporte =
  | 'urgente'
  | 'prioritaria'
  | 'normal'
  | 'baixa';

export type AtualizarTransportePrioridadeInput = {
  id: string;
  unidadeId: string;
  isPrioridade: boolean;
  nivelPrioridade: NivelPrioridadeTransporte | null;
};

export type AtualizarTransportePrioridadeResult = {
  id: string;
  rota: string;
  isPrioridade: boolean;
  nivelPrioridade: NivelPrioridadeTransporte | null;
};

export async function updateTransportePrioridadeDb(
  db: DrizzleClient,
  input: AtualizarTransportePrioridadeInput,
): Promise<AtualizarTransportePrioridadeResult | null> {
  const [updated] = await db
    .update(transportes)
    .set({
      isPrioridade: input.isPrioridade,
      nivelPrioridade: input.nivelPrioridade,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(transportes.numeroTransporte, input.id),
        eq(transportes.unidadeId, input.unidadeId),
      ),
    )
    .returning({
      id: transportes.numeroTransporte,
      rota: transportes.numeroTransporte,
      isPrioridade: transportes.isPrioridade,
      nivelPrioridade: transportes.nivelPrioridade,
    });

  if (!updated) {
    return null;
  }

  return {
    id: updated.id,
    rota: updated.rota,
    isPrioridade: updated.isPrioridade,
    nivelPrioridade: updated.nivelPrioridade,
  };
}
