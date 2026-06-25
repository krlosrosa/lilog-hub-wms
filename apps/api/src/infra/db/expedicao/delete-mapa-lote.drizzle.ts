import { and, eq, inArray, ne, sql } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  cortes,
  mapaGrupos,
  mapaLotes,
  transportes,
} from '../providers/drizzle/config/migrations/schema.js';

export type ExcluirMapaLoteResult = {
  loteId: string;
  transportesAfetados: number;
};

export async function deleteMapaLoteDb(
  db: DrizzleClient,
  loteId: string,
  unidadeId: string,
): Promise<ExcluirMapaLoteResult | null> {
  return db.transaction(async (tx) => {
    const [lote] = await tx
      .select({ id: mapaLotes.id })
      .from(mapaLotes)
      .where(and(eq(mapaLotes.id, loteId), eq(mapaLotes.unidadeId, unidadeId)))
      .limit(1);

    if (!lote) {
      return null;
    }

    const gruposDoLote = await tx
      .select({ id: mapaGrupos.id, iniciadoEm: mapaGrupos.iniciadoEm })
      .from(mapaGrupos)
      .where(eq(mapaGrupos.mapaLoteId, loteId));

    const grupoIniciado = gruposDoLote.some((grupo) => grupo.iniciadoEm != null);

    if (grupoIniciado) {
      throw new Error(
        'Não é possível excluir o mapa: a separação já foi iniciada para um ou mais grupos.',
      );
    }

    if (gruposDoLote.length > 0) {
      const grupoIds = gruposDoLote.map((grupo) => grupo.id);

      const [corteAtivo] = await tx
        .select({ id: cortes.id })
        .from(cortes)
        .where(
          and(
            inArray(cortes.mapaGrupoId, grupoIds),
            ne(cortes.status, 'cancelado'),
          ),
        )
        .limit(1);

      if (corteAtivo) {
        throw new Error(
          'Não é possível excluir o mapa: existe corte operacional ativo vinculado.',
        );
      }
    }

    const transportesAfetados = await tx
      .update(transportes)
      .set({
        mapaGeradoEm: null,
        ultimoMapaLoteId: null,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(transportes.unidadeId, unidadeId),
          eq(transportes.ultimoMapaLoteId, loteId),
        ),
      )
      .returning({ id: transportes.id });

    await tx
      .delete(mapaLotes)
      .where(and(eq(mapaLotes.id, loteId), eq(mapaLotes.unidadeId, unidadeId)));

    return {
      loteId,
      transportesAfetados: transportesAfetados.length,
    };
  });
}
