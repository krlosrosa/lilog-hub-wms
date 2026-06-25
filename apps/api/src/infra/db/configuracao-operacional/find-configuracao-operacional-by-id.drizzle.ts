import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { configuracoesOperacionais } from '../providers/drizzle/config/migrations/schema.js';
import { mapConfiguracaoOperacionalRow } from './map-configuracao-operacional.drizzle.js';

export async function findConfiguracaoOperacionalByIdDb(
  db: DrizzleClient,
  id: string,
) {
  const [row] = await db
    .select()
    .from(configuracoesOperacionais)
    .where(eq(configuracoesOperacionais.id, id))
    .limit(1);

  return row ? mapConfiguracaoOperacionalRow(row) : null;
}
