import { and, eq } from 'drizzle-orm';

import {
  CATEGORIA_PRODUTIVIDADE,
  DOMINIO_EXPEDICAO,
  parseParametrosPorSubtipo,
  SUBTIPO_SEPARACAO,
  type ParametrosSeparacao,
} from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { configuracoesOperacionais } from '../providers/drizzle/config/migrations/schema.js';

export async function obterParametrosSeparacaoPadraoDb(
  db: DrizzleClient,
  unidadeId: string,
): Promise<ParametrosSeparacao | null> {
  const [row] = await db
    .select({ parametros: configuracoesOperacionais.parametros })
    .from(configuracoesOperacionais)
    .where(
      and(
        eq(configuracoesOperacionais.unidadeId, unidadeId),
        eq(configuracoesOperacionais.dominio, DOMINIO_EXPEDICAO),
        eq(configuracoesOperacionais.categoria, CATEGORIA_PRODUTIVIDADE),
        eq(configuracoesOperacionais.subtipo, SUBTIPO_SEPARACAO),
        eq(configuracoesOperacionais.ativo, true),
        eq(configuracoesOperacionais.isPadrao, true),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  return parseParametrosPorSubtipo(SUBTIPO_SEPARACAO, row.parametros) as ParametrosSeparacao;
}
