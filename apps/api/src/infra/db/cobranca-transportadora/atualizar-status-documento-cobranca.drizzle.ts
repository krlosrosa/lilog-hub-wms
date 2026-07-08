import { and, eq } from 'drizzle-orm';

import type {
  AtualizarStatusDocumentoInput,
  AtualizarStatusDocumentoResult,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  cobrancaEventos,
  documentosCobranca,
} from '../providers/drizzle/config/migrations/schema.js';

export async function atualizarStatusDocumentoCobrancaDb(
  db: DrizzleClient,
  input: AtualizarStatusDocumentoInput,
): Promise<AtualizarStatusDocumentoResult | null> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        id: documentosCobranca.id,
        status: documentosCobranca.status,
      })
      .from(documentosCobranca)
      .where(
        and(
          eq(documentosCobranca.id, input.documentoId),
          eq(documentosCobranca.unidadeId, input.unidadeId),
        ),
      )
      .limit(1);

    if (!existing) return null;

    const now = new Date();
    const updateSet: Record<string, unknown> = {
      status: input.status,
      updatedAt: now,
    };

    if (input.observacao !== undefined) {
      updateSet.observacao = input.observacao;
    }

    if (input.status === 'emitido') {
      updateSet.emitidoEm = now;
    }

    if (input.status === 'enviado') {
      updateSet.enviadoEm = now;
    }

    if (input.status === 'pago') {
      updateSet.pagoEm = now;
    }

    const [updated] = await tx
      .update(documentosCobranca)
      .set(updateSet)
      .where(eq(documentosCobranca.id, input.documentoId))
      .returning({
        id: documentosCobranca.id,
        status: documentosCobranca.status,
        updatedAt: documentosCobranca.updatedAt,
        emitidoEm: documentosCobranca.emitidoEm,
        enviadoEm: documentosCobranca.enviadoEm,
        pagoEm: documentosCobranca.pagoEm,
      });

    if (!updated) return null;

    await tx.insert(cobrancaEventos).values({
      entidadeTipo: 'documento',
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
      emitidoEm: updated.emitidoEm,
      enviadoEm: updated.enviadoEm,
      pagoEm: updated.pagoEm,
    };
  });
}
