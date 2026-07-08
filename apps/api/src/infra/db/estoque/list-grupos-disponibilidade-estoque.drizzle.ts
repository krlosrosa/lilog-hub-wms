import { and, asc, eq, isNotNull, ne } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  produtos,
  saldosEndereco,
} from '../providers/drizzle/config/migrations/schema.js';

export async function listGruposDisponibilidadeEstoqueDb(
  db: DrizzleClient,
  unidadeId: string,
): Promise<string[]> {
  const rows = await db
    .selectDistinct({ grupo: produtos.grupo })
    .from(saldosEndereco)
    .innerJoin(produtos, eq(saldosEndereco.produtoId, produtos.produtoId))
    .where(
      and(
        eq(saldosEndereco.unidadeId, unidadeId),
        isNotNull(produtos.grupo),
        ne(produtos.grupo, ''),
      ),
    )
    .orderBy(asc(produtos.grupo));

  return rows
    .map((row) => row.grupo?.trim())
    .filter((grupo): grupo is string => Boolean(grupo));
}
