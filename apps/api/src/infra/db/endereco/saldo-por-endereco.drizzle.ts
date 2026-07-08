import { eq, sql } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { saldosEndereco } from '../providers/drizzle/config/migrations/schema.js';

export function buildSaldoPorEnderecoSubquery(db: DrizzleClient) {
  return db
    .select({
      enderecoId: saldosEndereco.enderecoId,
      totalQuantidade:
        sql<string>`coalesce(sum(${saldosEndereco.quantidade}), 0)`.as(
          'total_quantidade',
        ),
    })
    .from(saldosEndereco)
    .groupBy(saldosEndereco.enderecoId)
    .as('saldo_por_endereco');
}

export async function getTotalSaldoQuantidadeByEnderecoIdDb(
  db: DrizzleClient,
  enderecoId: string,
): Promise<number> {
  const [row] = await db
    .select({
      total: sql<string>`coalesce(sum(${saldosEndereco.quantidade}), 0)`.as(
        'total',
      ),
    })
    .from(saldosEndereco)
    .where(eq(saldosEndereco.enderecoId, enderecoId));

  return Number(row?.total ?? 0);
}
