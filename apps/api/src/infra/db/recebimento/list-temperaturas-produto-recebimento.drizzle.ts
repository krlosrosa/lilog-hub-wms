import { eq } from 'drizzle-orm';

import type { TemperaturaProdutoRecebimentoRecord } from '../../../domain/repositories/recebimento/conferencia.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { recebimentoTemperaturasProduto } from '../providers/drizzle/config/migrations/schema.js';

function mapRow(
  row: typeof recebimentoTemperaturasProduto.$inferSelect,
): TemperaturaProdutoRecebimentoRecord {
  return {
    id: row.id,
    recebimentoId: row.recebimentoId,
    etapa: row.etapa,
    temperatura: Number(row.temperatura),
    medidoEm: row.medidoEm,
    operatorId: row.operatorId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listTemperaturasProdutoRecebimentoDb(
  db: DrizzleClient,
  recebimentoId: string,
): Promise<TemperaturaProdutoRecebimentoRecord[]> {
  const rows = await db
    .select()
    .from(recebimentoTemperaturasProduto)
    .where(eq(recebimentoTemperaturasProduto.recebimentoId, recebimentoId));

  return rows.map(mapRow);
}
