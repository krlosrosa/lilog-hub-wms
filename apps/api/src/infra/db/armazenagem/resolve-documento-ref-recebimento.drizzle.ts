import { eq } from 'drizzle-orm';

import { buildPreRecebimentoDocumentoRef } from '../../../domain/model/estoque/deposito.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { recebimentos } from '../providers/drizzle/config/migrations/schema.js';

export async function resolveDocumentoRefByRecebimentoIdDb(
  db: DrizzleClient,
  recebimentoId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ preRecebimentoId: recebimentos.preRecebimentoId })
    .from(recebimentos)
    .where(eq(recebimentos.id, recebimentoId))
    .limit(1);

  if (!row) {
    return null;
  }

  return buildPreRecebimentoDocumentoRef(row.preRecebimentoId);
}
