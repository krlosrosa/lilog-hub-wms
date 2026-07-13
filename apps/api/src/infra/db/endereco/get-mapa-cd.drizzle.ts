import { asc, eq, sql } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { enderecos } from '../providers/drizzle/config/migrations/schema.js';
import { buildSaldoPorEnderecoSubquery } from './saldo-por-endereco.drizzle.js';

export type MapaCdRow = {
  id: string;
  zona: string;
  rua: string;
  posicao: string;
  nivel: string;
  tipo: string;
  status: string;
  cargaMaxKg: string;
  enderecoMascarado: string;
  ocupacaoPercent: string;
  totalSaldo: string;
};

export async function getMapaCdDb(
  db: DrizzleClient,
  unidadeId: string,
): Promise<MapaCdRow[]> {
  const saldoPorEndereco = buildSaldoPorEnderecoSubquery(db);

  const rows = await db
    .select({
      id: enderecos.id,
      zona: enderecos.zona,
      rua: enderecos.rua,
      posicao: enderecos.posicao,
      nivel: enderecos.nivel,
      tipo: enderecos.tipo,
      status: enderecos.status,
      cargaMaxKg: enderecos.cargaMaxKg,
      enderecoMascarado: enderecos.enderecoMascarado,
      ocupacaoPercent: enderecos.ocupacaoPercent,
      totalSaldo: sql<string>`coalesce(${saldoPorEndereco.totalQuantidade}, 0)`.as(
        'total_saldo',
      ),
    })
    .from(enderecos)
    .leftJoin(saldoPorEndereco, eq(enderecos.id, saldoPorEndereco.enderecoId))
    .where(eq(enderecos.unidadeId, unidadeId))
    .orderBy(
      asc(enderecos.zona),
      asc(enderecos.rua),
      asc(enderecos.posicao),
      asc(enderecos.nivel),
    );

  return rows;
}
