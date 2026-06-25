import { and, eq } from 'drizzle-orm';

import type { ConferirItemInput } from '../../../domain/model/recebimento/recebimento.model.js';
import type { ItemRecebimentoRecord } from '../../../domain/repositories/recebimento/recebimento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { itensRecebimento } from '../providers/drizzle/config/migrations/schema.js';
import {
  normalizeLote,
  normalizeNumeroSerie,
} from '../estoque/map-estoque.drizzle.js';
import {
  mapItemRecebimentoRow,
  toItemRecebimentoInsertValues,
} from './map-recebimento.drizzle.js';

function matchesConferenciaKey(
  row: typeof itensRecebimento.$inferSelect,
  data: ConferirItemInput,
  unitizadorId?: string | null,
): boolean {
  return (
    normalizeLote(row.loteRecebido) === normalizeLote(data.loteRecebido) &&
    normalizeNumeroSerie(row.numeroSerie) ===
      normalizeNumeroSerie(data.numeroSerie) &&
    (row.unitizadorId ?? null) === (unitizadorId ?? null)
  );
}

function isSameConferenciaPayload(
  row: typeof itensRecebimento.$inferSelect,
  data: ConferirItemInput,
): boolean {
  const pesoAtual =
    row.pesoRecebido !== null ? Number(row.pesoRecebido) : null;
  const pesoNovo =
    data.pesoRecebido !== undefined ? data.pesoRecebido : null;

  return (
    Number(row.quantidadeRecebida) === data.quantidadeRecebida &&
    row.unidadeMedida === data.unidadeMedida &&
    pesoAtual === pesoNovo &&
    (row.validade?.getTime() ?? null) === (data.validade?.getTime() ?? null)
  );
}

export async function addItemRecebimentoDb(
  db: DrizzleClient,
  recebimentoId: string,
  data: ConferirItemInput,
  unitizadorId?: string | null,
): Promise<ItemRecebimentoRecord> {
  const existingRows = await db
    .select()
    .from(itensRecebimento)
    .where(
      and(
        eq(itensRecebimento.recebimentoId, recebimentoId),
        eq(itensRecebimento.produtoId, data.produtoId),
      ),
    );

  const match = existingRows.find((row) =>
    matchesConferenciaKey(row, data, unitizadorId),
  );

  if (match) {
    if (isSameConferenciaPayload(match, data)) {
      return mapItemRecebimentoRow(match);
    }

    const [updated] = await db
      .update(itensRecebimento)
      .set({
        quantidadeRecebida: String(data.quantidadeRecebida),
        unidadeMedida: data.unidadeMedida,
        pesoRecebido:
          data.pesoRecebido !== undefined
            ? String(data.pesoRecebido)
            : match.pesoRecebido,
        validade: data.validade ?? match.validade,
      })
      .where(eq(itensRecebimento.id, match.id))
      .returning();

    if (!updated) {
      throw new Error('Failed to update conferido item');
    }

    return mapItemRecebimentoRow(updated);
  }

  const [record] = await db
    .insert(itensRecebimento)
    .values(toItemRecebimentoInsertValues(recebimentoId, data, unitizadorId))
    .returning();

  if (!record) {
    throw new Error('Failed to add item to recebimento');
  }

  return mapItemRecebimentoRow(record);
}
