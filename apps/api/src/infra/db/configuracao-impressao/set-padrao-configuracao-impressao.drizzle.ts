import { and, eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { configuracoesImpressao } from '../providers/drizzle/config/migrations/schema.js';
import { mapConfiguracaoImpressaoRow } from './map-configuracao-impressao.drizzle.js';

export async function setPadraoConfiguracaoImpressaoDb(
  db: DrizzleClient,
  id: string,
  unidadeId: string,
) {
  return db.transaction(async (tx) => {
    await tx
      .update(configuracoesImpressao)
      .set({ isPadrao: false, updatedAt: new Date() })
      .where(eq(configuracoesImpressao.unidadeId, unidadeId));

    const [record] = await tx
      .update(configuracoesImpressao)
      .set({ isPadrao: true, updatedAt: new Date() })
      .where(
        and(
          eq(configuracoesImpressao.id, id),
          eq(configuracoesImpressao.unidadeId, unidadeId),
        ),
      )
      .returning();

    return record ? mapConfiguracaoImpressaoRow(record) : null;
  });
}
