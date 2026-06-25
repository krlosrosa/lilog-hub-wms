import { and, asc, desc, eq } from 'drizzle-orm';

import type { ListConfiguracoesImpressaoFilter } from '../../../domain/repositories/configuracao-impressao/configuracao-impressao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { configuracoesImpressao } from '../providers/drizzle/config/migrations/schema.js';
import { mapConfiguracaoImpressaoRow } from './map-configuracao-impressao.drizzle.js';

export async function listConfiguracoesImpressaoDb(
  db: DrizzleClient,
  filter: ListConfiguracoesImpressaoFilter,
) {
  const rows = await db
    .select()
    .from(configuracoesImpressao)
    .where(eq(configuracoesImpressao.unidadeId, filter.unidadeId))
    .orderBy(
      desc(configuracoesImpressao.isPadrao),
      asc(configuracoesImpressao.nome),
    );

  return rows.map(mapConfiguracaoImpressaoRow);
}

export async function findConfiguracaoImpressaoByUnidadeAndNomeDb(
  db: DrizzleClient,
  unidadeId: string,
  nome: string,
) {
  const [row] = await db
    .select()
    .from(configuracoesImpressao)
    .where(
      and(
        eq(configuracoesImpressao.unidadeId, unidadeId),
        eq(configuracoesImpressao.nome, nome),
      ),
    )
    .limit(1);

  return row ? mapConfiguracaoImpressaoRow(row) : null;
}
