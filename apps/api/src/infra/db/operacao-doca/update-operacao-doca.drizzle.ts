import { eq } from 'drizzle-orm';

import type { UpdateOperacaoDocaData } from '../../../domain/repositories/operacao-doca/operacao-doca.repository.js';
import type { OperacaoDocaRecord } from '../../../domain/repositories/operacao-doca/operacao-doca.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { operacoesDoca } from '../providers/drizzle/config/migrations/schema.js';
import { findOperacaoDocaByIdDb } from './find-operacao-doca.drizzle.js';
import { toOperacaoDocaUpdateValues } from './map-operacao-doca.drizzle.js';

export async function updateOperacaoDocaDb(
  db: DrizzleClient,
  id: string,
  data: UpdateOperacaoDocaData,
): Promise<OperacaoDocaRecord | null> {
  const [updated] = await db
    .update(operacoesDoca)
    .set(toOperacaoDocaUpdateValues(data))
    .where(eq(operacoesDoca.id, id))
    .returning();

  if (!updated) {
    return null;
  }

  return findOperacaoDocaByIdDb(db, id);
}
