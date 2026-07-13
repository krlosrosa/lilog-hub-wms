import { eq } from 'drizzle-orm';

import type { RecebimentoSituacao } from '../../../domain/model/recebimento/recebimento.model.js';
import type { RecebimentoRecord } from '../../../domain/repositories/recebimento/recebimento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { recebimentos } from '../providers/drizzle/config/migrations/schema.js';
import { mapRecebimentoRow } from './map-recebimento.drizzle.js';

export async function updateRecebimentoStatusDb(
  db: DrizzleClient,
  id: string,
  situacao: RecebimentoSituacao,
  dataFim?: Date | null,
  quantidadePaletes?: number | null,
): Promise<RecebimentoRecord | null> {
  const [updated] = await db
    .update(recebimentos)
    .set({
      situacao,
      dataFim: dataFim === undefined ? undefined : dataFim,
      quantidadePaletes:
        quantidadePaletes === undefined ? undefined : quantidadePaletes,
      updatedAt: new Date(),
    })
    .where(eq(recebimentos.id, id))
    .returning();

  return updated ? mapRecebimentoRow(updated) : null;
}
