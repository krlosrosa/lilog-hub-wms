import { and, eq } from 'drizzle-orm';

import type { CreateConfiguracaoOperacionalInput } from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { configuracoesOperacionais } from '../providers/drizzle/config/migrations/schema.js';
import { mapConfiguracaoOperacionalRow } from './map-configuracao-operacional.drizzle.js';

export async function createConfiguracaoOperacionalDb(
  db: DrizzleClient,
  data: CreateConfiguracaoOperacionalInput,
) {
  return db.transaction(async (tx) => {
    if (data.isPadrao) {
      await tx
        .update(configuracoesOperacionais)
        .set({ isPadrao: false, updatedAt: new Date() })
        .where(
          and(
            eq(configuracoesOperacionais.unidadeId, data.unidadeId),
            eq(configuracoesOperacionais.dominio, data.dominio),
            eq(configuracoesOperacionais.categoria, data.categoria),
            eq(configuracoesOperacionais.subtipo, data.subtipo),
          ),
        );
    }

    const [record] = await tx
      .insert(configuracoesOperacionais)
      .values({
        unidadeId: data.unidadeId,
        dominio: data.dominio,
        categoria: data.categoria,
        subtipo: data.subtipo,
        nome: data.nome,
        descricao: data.descricao ?? null,
        parametros: data.parametros,
        versaoSchema: data.versaoSchema ?? 1,
        isPadrao: data.isPadrao ?? false,
        ativo: data.ativo ?? true,
        criadoPor: data.criadoPor ?? null,
      })
      .returning();

    if (!record) {
      throw new Error('Failed to create configuracao operacional');
    }

    return mapConfiguracaoOperacionalRow(record);
  });
}
