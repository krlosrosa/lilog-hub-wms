import { and, eq } from 'drizzle-orm';

import type { UpdateConfiguracaoOperacionalInput } from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { configuracoesOperacionais } from '../providers/drizzle/config/migrations/schema.js';
import { findConfiguracaoOperacionalByIdDb } from './find-configuracao-operacional-by-id.drizzle.js';
import { mapConfiguracaoOperacionalRow } from './map-configuracao-operacional.drizzle.js';

export async function updateConfiguracaoOperacionalDb(
  db: DrizzleClient,
  id: string,
  data: UpdateConfiguracaoOperacionalInput,
) {
  const atual = await findConfiguracaoOperacionalByIdDb(db, id);

  if (!atual) {
    return null;
  }

  return db.transaction(async (tx) => {
    if (data.isPadrao) {
      await tx
        .update(configuracoesOperacionais)
        .set({ isPadrao: false, updatedAt: new Date() })
        .where(
          and(
            eq(configuracoesOperacionais.unidadeId, atual.unidadeId),
            eq(configuracoesOperacionais.dominio, atual.dominio),
            eq(configuracoesOperacionais.categoria, atual.categoria),
            eq(configuracoesOperacionais.subtipo, atual.subtipo),
          ),
        );
    }

    const [record] = await tx
      .update(configuracoesOperacionais)
      .set({
        ...(data.nome !== undefined ? { nome: data.nome } : {}),
        ...(data.descricao !== undefined ? { descricao: data.descricao } : {}),
        ...(data.parametros !== undefined ? { parametros: data.parametros } : {}),
        ...(data.versaoSchema !== undefined
          ? { versaoSchema: data.versaoSchema }
          : {}),
        ...(data.isPadrao !== undefined ? { isPadrao: data.isPadrao } : {}),
        ...(data.ativo !== undefined ? { ativo: data.ativo } : {}),
        updatedAt: new Date(),
      })
      .where(eq(configuracoesOperacionais.id, id))
      .returning();

    if (!record) {
      throw new Error('Failed to update configuracao operacional');
    }

    return mapConfiguracaoOperacionalRow(record);
  });
}
