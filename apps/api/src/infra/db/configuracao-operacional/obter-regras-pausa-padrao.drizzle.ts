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
      isPadrao: configuracoesOperacionais.isPadrao,
    })
    .from(configuracoesOperacionais)
    .where(
      and(
        eq(configuracoesOperacionais.unidadeId, unidadeId),
        eq(configuracoesOperacionais.dominio, DOMINIO_OPERACIONAL),
        eq(configuracoesOperacionais.categoria, CATEGORIA_PAUSAS),
        eq(configuracoesOperacionais.ativo, true),
      ),
    );

  const groupedBySubtipo = new Map<
    string,
    Array<{ subtipo: string; parametros: unknown; isPadrao: boolean }>
  >();

  for (const row of rows) {
    if (!isSubtipoPausa(row.subtipo)) {
      continue;
    }

    const list = groupedBySubtipo.get(row.subtipo) ?? [];
    list.push(row);
    groupedBySubtipo.set(row.subtipo, list);
  }

  const records: Array<{ subtipo: string; parametros: unknown }> = [];

  for (const [subtipo, list] of groupedBySubtipo.entries()) {
    if (!list.length) {
      continue;
    }

    const preferida =
      list.find((item) => item.isPadrao) ??
      list[0];

    if (!preferida) {
      continue;
    }

    records.push({
      subtipo,
      parametros: preferida.parametros,
    });
  }

  return mapRegrasPausaFromRecords(records);
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
