import { and, asc, eq } from 'drizzle-orm';

import type { CreateConfiguracaoImpressaoInput } from '../../../domain/model/configuracao-impressao/configuracao-impressao.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { configuracoesImpressao } from '../providers/drizzle/config/migrations/schema.js';
import { mapConfiguracaoImpressaoRow } from './map-configuracao-impressao.drizzle.js';

export async function createConfiguracaoImpressaoDb(
  db: DrizzleClient,
  data: CreateConfiguracaoImpressaoInput,
) {
  return db.transaction(async (tx) => {
    if (data.isPadrao) {
      await tx
        .update(configuracoesImpressao)
        .set({ isPadrao: false, updatedAt: new Date() })
        .where(eq(configuracoesImpressao.unidadeId, data.unidadeId));
    }

    const [record] = await tx
      .insert(configuracoesImpressao)
      .values({
        unidadeId: data.unidadeId,
        nome: data.nome,
        configuracao: data.configuracao,
        templatesHtml: data.templatesHtml,
        isPadrao: data.isPadrao ?? false,
        criadoPor: data.criadoPor ?? null,
      })
      .returning();

    if (!record) {
      throw new Error('Failed to create configuracao impressao');
    }

    return mapConfiguracaoImpressaoRow(record);
  });
}
