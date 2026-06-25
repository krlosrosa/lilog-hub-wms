import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { configuracoesImpressao } from '../providers/drizzle/config/migrations/schema.js';
import { mapConfiguracaoImpressaoRow } from './map-configuracao-impressao.drizzle.js';

export async function findConfiguracaoImpressaoByIdDb(
  db: DrizzleClient,
  id: string,
) {
  const [row] = await db
    .select()
    .from(configuracoesImpressao)
    .where(eq(configuracoesImpressao.id, id))
    .limit(1);

  return row ? mapConfiguracaoImpressaoRow(row) : null;
}
