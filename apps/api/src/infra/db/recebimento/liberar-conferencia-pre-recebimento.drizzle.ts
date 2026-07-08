import { eq } from 'drizzle-orm';

import type { PreRecebimentoRecord } from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { preRecebimentos } from '../providers/drizzle/config/migrations/schema.js';
import { mapPreRecebimentoRow } from './map-recebimento.drizzle.js';

export async function liberarConferenciaPreRecebimentoDb(
  db: DrizzleClient,
  id: string,
  docaId: string,
  dataChegada: Date,
): Promise<PreRecebimentoRecord | null> {
  const [updated] = await db
    .update(preRecebimentos)
    .set({
      situacao: 'liberado_para_conferencia',
      docaId,
      dataChegada,
      updatedAt: new Date(),
    })
    .where(eq(preRecebimentos.id, id))
    .returning();

  return updated ? mapPreRecebimentoRow(updated) : null;
}
