import type { CreateOperacaoDocaInput } from '../../../domain/model/doca/doca.model.js';
import type { OperacaoDocaRecord } from '../../../domain/repositories/operacao-doca/operacao-doca.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { operacoesDoca } from '../providers/drizzle/config/migrations/schema.js';
import { findOperacaoDocaByIdDb } from './find-operacao-doca.drizzle.js';
import { toOperacaoDocaInsertValues } from './map-operacao-doca.drizzle.js';

export async function createOperacaoDocaDb(
  db: DrizzleClient,
  data: CreateOperacaoDocaInput,
): Promise<OperacaoDocaRecord> {
  const [record] = await db
    .insert(operacoesDoca)
    .values(toOperacaoDocaInsertValues(data))
    .returning();

  if (!record) {
    throw new Error('Failed to create operacao doca');
  }

  const created = await findOperacaoDocaByIdDb(db, record.id);

  if (!created) {
    throw new Error('Failed to load created operacao doca');
  }

  return created;
}
