import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { configuracoesImpressao } from '../providers/drizzle/config/migrations/schema.js';

export async function deleteConfiguracaoImpressaoDb(
  db: DrizzleClient,
  id: string,
) {
  await db
    .delete(configuracoesImpressao)
    .where(eq(configuracoesImpressao.id, id));
}
