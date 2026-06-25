import { and, eq } from 'drizzle-orm';

import type { AtualizarViagemRavexInput } from '../../../domain/repositories/expedicao/transporte.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { transportes } from '../providers/drizzle/config/migrations/schema.js';

export async function atualizarViagemRavexTransporteDb(
  db: DrizzleClient,
  input: AtualizarViagemRavexInput,
): Promise<void> {
  const patch: Partial<typeof transportes.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.viagemId !== undefined) {
    patch.viagemId = input.viagemId;
  }

  if (input.viagemInicioEm !== undefined) {
    patch.viagemInicioEm = input.viagemInicioEm;
  }

  if (input.viagemFimEm !== undefined) {
    patch.viagemFimEm = input.viagemFimEm;
  }

  if (input.anomalia !== undefined) {
    patch.anomalia = input.anomalia;
  }

  if (input.status !== undefined) {
    patch.status = input.status;
  }

  await db
    .update(transportes)
    .set(patch)
    .where(
      and(
        eq(transportes.id, input.transporteId),
        eq(transportes.unidadeId, input.unidadeId),
      ),
    );
}
