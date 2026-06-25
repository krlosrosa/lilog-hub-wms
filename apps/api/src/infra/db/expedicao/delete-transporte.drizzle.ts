import { and, eq, ne } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { cortes, transportes } from '../providers/drizzle/config/migrations/schema.js';

export type ExcluirTransporteResult = {
  id: string;
  rota: string;
};

export async function deleteTransporteDb(
  db: DrizzleClient,
  id: string,
  unidadeId: string,
): Promise<ExcluirTransporteResult | null> {
  return db.transaction(async (tx) => {
    const [transporte] = await tx
      .select({
        id: transportes.id,
        rota: transportes.rota,
        ultimoMapaLoteId: transportes.ultimoMapaLoteId,
      })
      .from(transportes)
      .where(and(eq(transportes.id, id), eq(transportes.unidadeId, unidadeId)))
      .limit(1);

    if (!transporte) {
      return null;
    }

    if (transporte.ultimoMapaLoteId != null) {
      throw new Error(
        'Exclua o mapa de separação antes de excluir este transporte.',
      );
    }

    const [corteAtivo] = await tx
      .select({ id: cortes.id })
      .from(cortes)
      .where(
        and(eq(cortes.transporteId, id), ne(cortes.status, 'cancelado')),
      )
      .limit(1);

    if (corteAtivo) {
      throw new Error(
        'Não é possível excluir o transporte: existe corte operacional ativo.',
      );
    }

    await tx
      .delete(transportes)
      .where(and(eq(transportes.id, id), eq(transportes.unidadeId, unidadeId)));

    return {
      id: transporte.id,
      rota: transporte.rota,
    };
  });
}
