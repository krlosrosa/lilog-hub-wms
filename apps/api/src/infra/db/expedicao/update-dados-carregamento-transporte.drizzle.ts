import { and, eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { transportes } from '../providers/drizzle/config/migrations/schema.js';

export type UpdateDadosCarregamentoTransporteInput = {
  transporteId: string;
  unidadeId: string;
  docaId?: string | null;
  lacreCarregamento?: string | null;
};

export type UpdateDadosCarregamentoTransporteResult = {
  id: string;
  rota: string;
  docaId: string | null;
  lacreCarregamento: string | null;
};

export async function updateDadosCarregamentoTransporteDb(
  db: DrizzleClient,
  input: UpdateDadosCarregamentoTransporteInput,
): Promise<UpdateDadosCarregamentoTransporteResult | null> {
  const patch: {
    docaId?: string | null;
    lacreCarregamento?: string | null;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  if (input.docaId !== undefined) {
    patch.docaId = input.docaId;
  }

  if (input.lacreCarregamento !== undefined) {
    patch.lacreCarregamento = input.lacreCarregamento;
  }

  const [updated] = await db
    .update(transportes)
    .set(patch)
    .where(
      and(
        eq(transportes.numeroTransporte, input.transporteId),
        eq(transportes.unidadeId, input.unidadeId),
      ),
    )
    .returning({
      id: transportes.numeroTransporte,
      rota: transportes.numeroTransporte,
      docaId: transportes.docaId,
      lacreCarregamento: transportes.lacreCarregamento,
    });

  return updated ?? null;
}
