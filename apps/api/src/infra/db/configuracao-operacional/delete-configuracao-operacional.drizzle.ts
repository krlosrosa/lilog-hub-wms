import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { configuracoesOperacionais } from '../providers/drizzle/config/migrations/schema.js';

export async function deleteConfiguracaoOperacionalDb(
  db: DrizzleClient,
  id: string,
) {
  await db
    .delete(configuracoesOperacionais)
    .where(eq(configuracoesOperacionais.id, id));
}
