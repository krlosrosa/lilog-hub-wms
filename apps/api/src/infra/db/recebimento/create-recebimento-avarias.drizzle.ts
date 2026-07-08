import type { CreateRecebimentoAvariaInput } from '../../../domain/repositories/recebimento/recebimento-avaria.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { recebimentoAvarias } from '../providers/drizzle/config/migrations/schema.js';

function mapRow(row: typeof recebimentoAvarias.$inferSelect) {
  return {
    id: row.id,
    recebimentoId: row.recebimentoId,
    produtoId: row.produtoId,
    tipo: row.tipo,
    natureza: row.natureza,
    causa: row.causa,
    quantidadeCaixas: row.quantidadeCaixas,
    quantidadeUnidades: row.quantidadeUnidades,
    lote: row.lote,
    validade: row.validade,
    numeroSerie: row.numeroSerie,
    photoCount: row.photoCount,
    replicado: row.replicado,
    operatorId: row.operatorId,
    createdAt: row.createdAt,
  };
}

export async function createRecebimentoAvariasDb(
  db: DrizzleClient,
  items: CreateRecebimentoAvariaInput[],
) {
  if (items.length === 0) {
    return [];
  }

  const rows = await db
    .insert(recebimentoAvarias)
    .values(
      items.map((item) => ({
        recebimentoId: item.recebimentoId,
        produtoId: item.produtoId ?? null,
        tipo: item.tipo,
        natureza: item.natureza,
        causa: item.causa,
        quantidadeCaixas: item.quantidadeCaixas,
        quantidadeUnidades: item.quantidadeUnidades,
        lote: item.lote ?? null,
        validade: item.validade ?? null,
        numeroSerie: item.numeroSerie ?? null,
        photoCount: item.photoCount,
        replicado: item.replicado,
        operatorId: item.operatorId,
      })),
    )
    .returning();

  return rows.map(mapRow);
}
