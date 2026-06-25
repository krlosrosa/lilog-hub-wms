import { eq } from 'drizzle-orm';

import type { PreRecebimentoSituacao } from '../../../domain/model/recebimento/recebimento.model.js';
import type { PreRecebimentoRecord } from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { preRecebimentos } from '../providers/drizzle/config/migrations/schema.js';
import { mapPreRecebimentoRow } from './map-recebimento.drizzle.js';

export async function updatePreRecebimentoSituacaoDb(
  db: DrizzleClient,
  id: string,
  situacao: PreRecebimentoSituacao,
  dataChegada?: Date | null,
): Promise<PreRecebimentoRecord | null> {
  const [updated] = await db
    .update(preRecebimentos)
    .set({
      situacao,
      dataChegada: dataChegada ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(preRecebimentos.id, id))
    .returning();

  return updated ? mapPreRecebimentoRow(updated) : null;
}
