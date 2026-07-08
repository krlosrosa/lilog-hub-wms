import { and, eq } from 'drizzle-orm';

import type {
  AtualizarStatusProcessoInput,
  AtualizarStatusProcessoResult,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  cobrancaEventos,
  processosDebito,
} from '../providers/drizzle/config/migrations/schema.js';

export async function atualizarStatusProcessoDebitoDb(
  db: DrizzleClient,
  input: AtualizarStatusProcessoInput,
): Promise<AtualizarStatusProcessoResult | null> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        id: processosDebito.id,
        status: processosDebito.status,
      })
      .from(processosDebito)
      .where(
        and(
          eq(processosDebito.id, input.processoId),
          eq(processosDebito.unidadeId, input.unidadeId),
        ),
      )
      .limit(1);

    if (!existing) return null;

    const now = new Date();

    const [updated] = await tx
      .update(processosDebito)
      .set({
        status: input.status,
        observacao: input.observacao ?? undefined,
        updatedAt: now,
      })
      .where(eq(processosDebito.id, input.processoId))
      .returning({
        id: processosDebito.id,
        status: processosDebito.status,
        updatedAt: processosDebito.updatedAt,
      });

    if (!updated) return null;

    await tx.insert(cobrancaEventos).values({
      entidadeTipo: 'processo',
      entidadeId: updated.id,
      statusAnterior: existing.status,
      statusNovo: input.status,
      descricao: input.observacao ?? `Status alterado para ${input.status}`,
      criadoPorUserId: input.criadoPorUserId ?? null,
    });

    return {
      id: updated.id,
      status: updated.status,
      statusAnterior: existing.status,
      updatedAt: updated.updatedAt,
    };
  });
}
