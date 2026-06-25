import { and, asc, desc, eq } from 'drizzle-orm';

import type { ListConfiguracoesOperacionaisFilter } from '../../../domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { configuracoesOperacionais } from '../providers/drizzle/config/migrations/schema.js';
import { mapConfiguracaoOperacionalRow } from './map-configuracao-operacional.drizzle.js';

export async function listConfiguracoesOperacionaisDb(
  db: DrizzleClient,
  filter: ListConfiguracoesOperacionaisFilter,
) {
  const conditions = [eq(configuracoesOperacionais.unidadeId, filter.unidadeId)];

  if (filter.dominio !== undefined) {
    conditions.push(eq(configuracoesOperacionais.dominio, filter.dominio));
  }

  if (filter.categoria !== undefined) {
    conditions.push(eq(configuracoesOperacionais.categoria, filter.categoria));
  }

  if (filter.subtipo !== undefined) {
    conditions.push(eq(configuracoesOperacionais.subtipo, filter.subtipo));
  }

  if (filter.ativo !== undefined) {
    conditions.push(eq(configuracoesOperacionais.ativo, filter.ativo));
  }

  const rows = await db
    .select()
    .from(configuracoesOperacionais)
    .where(and(...conditions))
    .orderBy(
      desc(configuracoesOperacionais.isPadrao),
      asc(configuracoesOperacionais.nome),
    );

  return rows.map(mapConfiguracaoOperacionalRow);
}

export async function findConfiguracaoOperacionalByUnidadeDominioCategoriaSubtipoNomeDb(
  db: DrizzleClient,
  unidadeId: string,
  dominio: string,
  categoria: string,
  subtipo: string,
  nome: string,
) {
  const [row] = await db
    .select()
    .from(configuracoesOperacionais)
    .where(
      and(
        eq(configuracoesOperacionais.unidadeId, unidadeId),
        eq(configuracoesOperacionais.dominio, dominio),
        eq(configuracoesOperacionais.categoria, categoria),
        eq(configuracoesOperacionais.subtipo, subtipo),
        eq(configuracoesOperacionais.nome, nome),
      ),
    )
    .limit(1);

  return row ? mapConfiguracaoOperacionalRow(row) : null;
}
