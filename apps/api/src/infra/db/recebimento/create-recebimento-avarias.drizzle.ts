import { and, eq } from 'drizzle-orm';

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
    clientDamageId: row.clientDamageId,
    operatorId: row.operatorId,
    createdAt: row.createdAt,
  };
}

async function findExistingByClientDamageId(
  db: DrizzleClient,
  recebimentoId: string,
  clientDamageId: string,
) {
  const [row] = await db
    .select()
    .from(recebimentoAvarias)
    .where(
      and(
        eq(recebimentoAvarias.recebimentoId, recebimentoId),
        eq(recebimentoAvarias.clientDamageId, clientDamageId),
      ),
    )
    .limit(1);

  return row ? mapRow(row) : null;
}

export async function createRecebimentoAvariasDb(
  db: DrizzleClient,
  items: CreateRecebimentoAvariaInput[],
) {
  if (items.length === 0) {
    return [];
  }

  const createdItems = [];

  for (const item of items) {
    const clientDamageId = item.clientDamageId?.trim() || null;

    if (clientDamageId) {
      const existing = await findExistingByClientDamageId(
        db,
        item.recebimentoId,
        clientDamageId,
      );
      if (existing) {
        createdItems.push(existing);
        continue;
      }
    }

    const [row] = await db
      .insert(recebimentoAvarias)
      .values({
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
        clientDamageId,
        operatorId: item.operatorId,
      })
      .onConflictDoNothing({
        target: [recebimentoAvarias.recebimentoId, recebimentoAvarias.clientDamageId],
      })
      .returning();

    if (row) {
      createdItems.push(mapRow(row));
      continue;
    }

    if (clientDamageId) {
      const existing = await findExistingByClientDamageId(
        db,
        item.recebimentoId,
        clientDamageId,
      );
      if (existing) {
        createdItems.push(existing);
      }
    }
  }

  return createdItems;
}
