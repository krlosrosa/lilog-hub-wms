import type { IniciarRecebimentoInput } from '../../../domain/model/recebimento/recebimento.model.js';
import type { RecebimentoRecord } from '../../../domain/repositories/recebimento/recebimento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { recebimentos } from '../providers/drizzle/config/migrations/schema.js';
import { findRecebimentoByIdDb } from './find-recebimento.drizzle.js';
import { toRecebimentoInsertValues } from './map-recebimento.drizzle.js';

export async function createRecebimentoDb(
  db: DrizzleClient,
  data: IniciarRecebimentoInput,
  userId: number | null,
  modoUnitizacao: string,
): Promise<RecebimentoRecord> {
  const [record] = await db
    .insert(recebimentos)
    .values(toRecebimentoInsertValues(data, userId, modoUnitizacao))
    .returning();

  if (!record) {
    throw new Error('Failed to create recebimento');
  }

  const created = await findRecebimentoByIdDb(db, record.id);

  if (!created) {
    throw new Error('Failed to load created recebimento');
  }

  return created;
}
