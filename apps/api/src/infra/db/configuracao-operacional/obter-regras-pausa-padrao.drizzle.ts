import { and, eq } from 'drizzle-orm';

import {
  CATEGORIA_PAUSAS,
  DOMINIO_OPERACIONAL,
  isSubtipoPausa,
  parseParametrosConfig,
  type ParametrosPausa,
  type RegrasPausaPadraoMap,
  type SubtipoPausa,
} from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { configuracoesOperacionais } from '../providers/drizzle/config/migrations/schema.js';

export async function obterRegrasPausaPadraoDb(
  db: DrizzleClient,
  unidadeId: string,
): Promise<RegrasPausaPadraoMap> {
  const rows = await db
    .select({
      subtipo: configuracoesOperacionais.subtipo,
      parametros: configuracoesOperacionais.parametros,
    })
    .from(configuracoesOperacionais)
    .where(
      and(
        eq(configuracoesOperacionais.unidadeId, unidadeId),
        eq(configuracoesOperacionais.dominio, DOMINIO_OPERACIONAL),
        eq(configuracoesOperacionais.categoria, CATEGORIA_PAUSAS),
        eq(configuracoesOperacionais.ativo, true),
        eq(configuracoesOperacionais.isPadrao, true),
      ),
    );

  const regras: RegrasPausaPadraoMap = {};

  for (const row of rows) {
    if (!isSubtipoPausa(row.subtipo)) {
      continue;
    }

    regras[row.subtipo] = parseParametrosConfig(
      CATEGORIA_PAUSAS,
      row.subtipo,
      row.parametros,
    ) as ParametrosPausa;
  }

  return regras;
}

export function mapRegrasPausaFromRecords(
  records: Array<{ subtipo: string; parametros: unknown }>,
): RegrasPausaPadraoMap {
  const regras: RegrasPausaPadraoMap = {};

  for (const record of records) {
    if (!isSubtipoPausa(record.subtipo)) {
      continue;
    }

    regras[record.subtipo as SubtipoPausa] = parseParametrosConfig(
      CATEGORIA_PAUSAS,
      record.subtipo,
      record.parametros,
    ) as ParametrosPausa;
  }

  return regras;
}
