import { and, eq, max } from 'drizzle-orm';

import type { PesagemRecebimentoRecord } from '../../../domain/repositories/recebimento/recebimento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { pesagensRecebimento } from '../providers/drizzle/config/migrations/schema.js';
import { mapPesagemRecebimentoRow } from './map-recebimento.drizzle.js';

export class EtiquetaPesagemDuplicadaError extends Error {
  constructor(etiquetaCodigo: string) {
    super(`Etiqueta "${etiquetaCodigo}" já está em uso nesta unidade`);
    this.name = 'EtiquetaPesagemDuplicadaError';
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === '23505'
  );
}

export type CreatePesagemRecebimentoInput = {
  recebimentoItemId: string;
  unidadeId: string;
  pesoKg: number;
  etiquetaCodigo?: string | null;
  conferidoPorId?: number | null;
  clientConferenceId?: string | null;
};

async function findExistingByClientConferenceId(
  db: DrizzleClient,
  recebimentoItemId: string,
  clientConferenceId: string,
): Promise<PesagemRecebimentoRecord | null> {
  const [row] = await db
    .select()
    .from(pesagensRecebimento)
    .where(
      and(
        eq(pesagensRecebimento.recebimentoItemId, recebimentoItemId),
        eq(pesagensRecebimento.clientConferenceId, clientConferenceId),
      ),
    )
    .limit(1);

  return row ? mapPesagemRecebimentoRow(row) : null;
}

export async function createPesagemRecebimentoDb(
  db: DrizzleClient,
  data: CreatePesagemRecebimentoInput,
): Promise<PesagemRecebimentoRecord> {
  const clientConferenceId = data.clientConferenceId?.trim() || null;

  if (clientConferenceId) {
    const existing = await findExistingByClientConferenceId(
      db,
      data.recebimentoItemId,
      clientConferenceId,
    );
    if (existing) {
      return existing;
    }
  }

  const [seqRow] = await db
    .select({ maxSeq: max(pesagensRecebimento.sequenciaCaixa) })
    .from(pesagensRecebimento)
    .where(eq(pesagensRecebimento.recebimentoItemId, data.recebimentoItemId));

  const sequenciaCaixa = (seqRow?.maxSeq ?? 0) + 1;

  try {
    const [record] = await db
      .insert(pesagensRecebimento)
      .values({
        recebimentoItemId: data.recebimentoItemId,
        unidadeId: data.unidadeId,
        sequenciaCaixa,
        etiquetaCodigo: data.etiquetaCodigo?.trim() || null,
        pesoKg: String(data.pesoKg),
        conferidoPorId: data.conferidoPorId ?? null,
        clientConferenceId,
      })
      .onConflictDoNothing({
        target: [
          pesagensRecebimento.recebimentoItemId,
          pesagensRecebimento.clientConferenceId,
        ],
      })
      .returning();

    if (record) {
      return mapPesagemRecebimentoRow(record);
    }

    if (clientConferenceId) {
      const existing = await findExistingByClientConferenceId(
        db,
        data.recebimentoItemId,
        clientConferenceId,
      );
      if (existing) {
        return existing;
      }
    }

    throw new Error('Failed to create pesagem recebimento');
  } catch (error) {
    if (isUniqueViolation(error) && data.etiquetaCodigo?.trim()) {
      throw new EtiquetaPesagemDuplicadaError(data.etiquetaCodigo.trim());
    }

    throw error;
  }
}
