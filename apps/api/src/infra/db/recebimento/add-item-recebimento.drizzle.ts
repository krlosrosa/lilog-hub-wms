import { and, count, eq, sum } from 'drizzle-orm';

import type { ConferirItemInput } from '../../../domain/model/recebimento/recebimento.model.js';
import type {
  AddItemRecebimentoOptions,
  AddItemRecebimentoResult,
  ItemRecebimentoRecord,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  itensRecebimento,
  pesagensRecebimento,
} from '../providers/drizzle/config/migrations/schema.js';
import {
  normalizeLote,
  normalizeNumeroSerie,
} from '../../../shared/utils/normalize-lote-serie.js';
import { createPesagemRecebimentoDb } from './create-pesagem-recebimento.drizzle.js';
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
    (row.unitizadorId ?? null) === (unitizadorId ?? null) &&
    (row.validade?.getTime() ?? null) === (data.validade?.getTime() ?? null)
  );
}

async function syncItemTotalsFromPesagens(
  db: DrizzleClient,
  itemId: string,
): Promise<ItemRecebimentoRecord> {
  const [aggregate] = await db
    .select({
      totalPeso: sum(pesagensRecebimento.pesoKg),
      totalCaixas: count(pesagensRecebimento.id),
    })
    .from(pesagensRecebimento)
    .where(eq(pesagensRecebimento.recebimentoItemId, itemId));

  const totalCaixas = Number(aggregate?.totalCaixas ?? 0);

  const [updated] = await db
    .update(itensRecebimento)
    .set({
      quantidadeRecebida: String(totalCaixas),
      pesoRecebido: aggregate?.totalPeso ?? null,
      unidadeMedida: 'CX',
    })
    .where(eq(itensRecebimento.id, itemId))
    .returning();

  if (!updated) {
    throw new Error('Failed to sync PVAR item totals from pesagens');
  }

  return mapItemRecebimentoRow(updated);
}

async function findOrCreatePvarItem(
  db: DrizzleClient,
  recebimentoId: string,
  unidadeId: string,
  data: ConferirItemInput,
  unitizadorId: string | null,
  conferidoPorId: number | null,
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
    if (data.validade && match.validade?.getTime() !== data.validade.getTime()) {
      const [updated] = await db
        .update(itensRecebimento)
        .set({ validade: data.validade })
        .where(eq(itensRecebimento.id, match.id))
        .returning();

      if (!updated) {
        throw new Error('Failed to update PVAR item validade');
      }

      return mapItemRecebimentoRow(updated);
    }

    return mapItemRecebimentoRow(match);
  }

  const insertValues = {
    ...toItemRecebimentoInsertValues(
      recebimentoId,
      unidadeId,
      data,
      unitizadorId,
      conferidoPorId,
    ),
    quantidadeRecebida: '0',
    pesoRecebido: null,
    unidadeMedida: 'CX',
  };

  const [record] = await db
    .insert(itensRecebimento)
    .values(insertValues)
    .returning();

  if (!record) {
    throw new Error('Failed to add PVAR item to recebimento');
  }

  return mapItemRecebimentoRow(record);
}

export async function addItemRecebimentoDb(
  db: DrizzleClient,
  recebimentoId: string,
  unidadeId: string,
  data: ConferirItemInput,
  options?: AddItemRecebimentoOptions,
): Promise<AddItemRecebimentoResult> {
  const unitizadorId = options?.unitizadorId ?? null;
  const pesoVariavel = options?.pesoVariavel ?? false;
  const conferidoPorId = options?.conferidoPorId ?? null;

  if (pesoVariavel) {
    const itemBase = await findOrCreatePvarItem(
      db,
      recebimentoId,
      unidadeId,
      data,
      unitizadorId,
      conferidoPorId,
    );

    if (data.pesoRecebido === undefined) {
      throw new Error('pesoRecebido is required for PVAR items');
    }

    const pesagem = await createPesagemRecebimentoDb(db, {
      recebimentoItemId: itemBase.id,
      unidadeId,
      pesoKg: data.pesoRecebido,
      etiquetaCodigo: data.etiquetaCodigo,
      conferidoPorId,
      clientConferenceId: options?.clientConferenceId ?? null,
    });

    const item = await syncItemTotalsFromPesagens(db, itemBase.id);

    return { item, pesagem };
  }

  const [record] = await db
    .insert(itensRecebimento)
    .values(
      toItemRecebimentoInsertValues(
        recebimentoId,
        unidadeId,
        data,
        unitizadorId,
        conferidoPorId,
      ),
    )
    .returning();

  if (!record) {
    throw new Error('Failed to add item to recebimento');
  }

  return { item: mapItemRecebimentoRow(record), pesagem: null };
}
