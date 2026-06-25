import { and, eq } from 'drizzle-orm';

import type { SubtipoConfiguracao } from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { configuracoesOperacionais } from '../providers/drizzle/config/migrations/schema.js';
import { mapConfiguracaoOperacionalRow } from './map-configuracao-operacional.drizzle.js';

export async function setPadraoConfiguracaoOperacionalDb(
  db: DrizzleClient,
  id: string,
  unidadeId: string,
  dominio: string,
  categoria: string,
  subtipo: SubtipoConfiguracao,
) {
  return db.transaction(async (tx) => {
    await tx
      .update(configuracoesOperacionais)
      .set({ isPadrao: false, updatedAt: new Date() })
      .where(
        and(
          eq(configuracoesOperacionais.unidadeId, unidadeId),
          eq(configuracoesOperacionais.dominio, dominio),
          eq(configuracoesOperacionais.categoria, categoria),
          eq(configuracoesOperacionais.subtipo, subtipo),
        ),
      );

    const [record] = await tx
      .update(configuracoesOperacionais)
      .set({ isPadrao: true, updatedAt: new Date() })
      .where(
        and(
          eq(configuracoesOperacionais.id, id),
          eq(configuracoesOperacionais.unidadeId, unidadeId),
          eq(configuracoesOperacionais.dominio, dominio),
          eq(configuracoesOperacionais.categoria, categoria),
          eq(configuracoesOperacionais.subtipo, subtipo),
        ),
      )
      .returning();

    return record ? mapConfiguracaoOperacionalRow(record) : null;
  });
}
