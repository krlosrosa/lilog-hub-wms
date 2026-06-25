import { eq } from 'drizzle-orm';

import type { UpdateConfiguracaoImpressaoInput } from '../../../domain/model/configuracao-impressao/configuracao-impressao.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { configuracoesImpressao } from '../providers/drizzle/config/migrations/schema.js';
import { findConfiguracaoImpressaoByIdDb } from './find-configuracao-impressao-by-id.drizzle.js';
import { mapConfiguracaoImpressaoRow } from './map-configuracao-impressao.drizzle.js';

export async function updateConfiguracaoImpressaoDb(
  db: DrizzleClient,
  id: string,
  data: UpdateConfiguracaoImpressaoInput,
) {
  const atual = await findConfiguracaoImpressaoByIdDb(db, id);

  if (!atual) {
    return null;
  }

  return db.transaction(async (tx) => {
    if (data.isPadrao) {
      await tx
        .update(configuracoesImpressao)
        .set({ isPadrao: false, updatedAt: new Date() })
        .where(eq(configuracoesImpressao.unidadeId, atual.unidadeId));
    }

    const [record] = await tx
      .update(configuracoesImpressao)
      .set({
        ...(data.nome !== undefined ? { nome: data.nome } : {}),
        ...(data.configuracao !== undefined
          ? { configuracao: data.configuracao }
          : {}),
        ...(data.templatesHtml !== undefined
          ? { templatesHtml: data.templatesHtml }
          : {}),
        ...(data.isPadrao !== undefined ? { isPadrao: data.isPadrao } : {}),
        updatedAt: new Date(),
      })
      .where(eq(configuracoesImpressao.id, id))
      .returning();

    if (!record) {
      throw new Error('Failed to update configuracao impressao');
    }

    return mapConfiguracaoImpressaoRow(record);
  });
}
