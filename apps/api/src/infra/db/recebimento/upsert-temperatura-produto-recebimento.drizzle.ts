import type { UpsertTemperaturaProdutoRecebimentoInput } from '../../../domain/model/recebimento/recebimento.model.js';
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

export async function upsertTemperaturaProdutoRecebimentoDb(
  db: DrizzleClient,
  recebimentoId: string,
  data: UpsertTemperaturaProdutoRecebimentoInput,
  operatorId: number | null,
): Promise<TemperaturaProdutoRecebimentoRecord> {
  const now = new Date();
  const values = {
    recebimentoId,
    etapa: data.etapa,
    temperatura: String(data.temperatura),
    medidoEm: now,
    operatorId,
    updatedAt: now,
  };

  const [row] = await db
    .insert(recebimentoTemperaturasProduto)
    .values(values)
    .onConflictDoUpdate({
      target: [
        recebimentoTemperaturasProduto.recebimentoId,
        recebimentoTemperaturasProduto.etapa,
      ],
      set: {
        temperatura: values.temperatura,
        medidoEm: values.medidoEm,
        operatorId: values.operatorId,
        updatedAt: values.updatedAt,
      },
    })
    .returning();

  if (!row) {
    throw new Error('Falha ao registrar temperatura do produto.');
  }

  return mapRow(row);
}
