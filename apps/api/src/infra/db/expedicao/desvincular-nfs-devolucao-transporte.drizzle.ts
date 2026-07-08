import { and, eq, inArray, ne, sql } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  transportePossuiMapaConferenciaReentregaDb,
} from './mapa-conferencia-reentrega.drizzle.js';
import {
  cortes,
  remessas,
  transporteRemessas,
  transportes,
} from '../providers/drizzle/config/migrations/schema.js';

export type DesvincularNfsDevolucaoTransporteInput = {
  unidadeId: string;
  transporteId: string;
  remessaIds: string[];
};

export type DesvincularNfsDevolucaoTransporteResult = {
  remessasDesvinculadas: number;
  remessaIds: string[];
};

export async function desvincularNfsDevolucaoTransporteDb(
  db: DrizzleClient,
  input: DesvincularNfsDevolucaoTransporteInput,
): Promise<DesvincularNfsDevolucaoTransporteResult> {
  return db.transaction(async (tx) => {
    const [transporte] = await tx
      .select({ id: transportes.numeroTransporte })
      .from(transportes)
      .where(
        and(
          eq(transportes.numeroTransporte, input.transporteId),
          eq(transportes.unidadeId, input.unidadeId),
        ),
      )
      .limit(1);

    if (!transporte) {
      throw new Error('Transporte não encontrado para a unidade informada.');
    }

    const possuiMapaConferenciaReentrega =
      await transportePossuiMapaConferenciaReentregaDb(tx, {
        transporteId: input.transporteId,
        remessaIds: input.remessaIds,
      });

    if (possuiMapaConferenciaReentrega) {
      throw new Error(
        'Exclua o mapa de conferência reentrega antes de desalocar estas NFs.',
      );
    }

    const [corteAtivo] = await tx
      .select({ id: cortes.id })
      .from(cortes)
      .where(
        and(
          eq(cortes.transporteId, input.transporteId),
          ne(cortes.status, 'cancelado'),
        ),
      )
      .limit(1);

    if (corteAtivo) {
      throw new Error(
        'Não é possível desalocar reentregas: existe corte operacional ativo.',
      );
    }

    const remessasValidas = await tx
      .select({
        id: remessas.id,
        peso: remessas.peso,
        volume: remessas.volume,
      })
      .from(remessas)
      .innerJoin(
        transporteRemessas,
        eq(transporteRemessas.remessaId, remessas.id),
      )
      .where(
        and(
          eq(transporteRemessas.transporteId, input.transporteId),
          eq(remessas.origem, 'reentrega'),
          inArray(remessas.id, input.remessaIds),
        ),
      );

    if (remessasValidas.length !== input.remessaIds.length) {
      const encontrados = new Set(remessasValidas.map((remessa) => remessa.id));
      const invalidos = input.remessaIds.filter((id) => !encontrados.has(id));

      throw new Error(
        `Remessas inválidas ou não são reentregas deste transporte: ${invalidos.join(', ')}`,
      );
    }

    let pesoRemover = 0;
    let volumeRemover = 0;

    for (const remessa of remessasValidas) {
      pesoRemover += Number(remessa.peso);
      volumeRemover += Number(remessa.volume);

      await tx
        .delete(transporteRemessas)
        .where(
          and(
            eq(transporteRemessas.transporteId, input.transporteId),
            eq(transporteRemessas.remessaId, remessa.id),
          ),
        );

      await tx.delete(remessas).where(eq(remessas.id, remessa.id));
    }

    if (pesoRemover > 0 || volumeRemover > 0) {
      await tx
        .update(transportes)
        .set({
          pesoTotal: sql`${transportes.pesoTotal} - ${pesoRemover.toFixed(3)}`,
          volumeTotal: sql`${transportes.volumeTotal} - ${volumeRemover.toFixed(3)}`,
          updatedAt: sql`now()`,
        })
        .where(
          and(
            eq(transportes.unidadeId, input.unidadeId),
            eq(transportes.numeroTransporte, input.transporteId),
          ),
        );
    }

    return {
      remessasDesvinculadas: remessasValidas.length,
      remessaIds: remessasValidas.map((remessa) => remessa.id),
    };
  });
}
