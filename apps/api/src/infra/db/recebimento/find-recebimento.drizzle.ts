import { eq } from 'drizzle-orm';

import type { RecebimentoWithDetails } from '../../../domain/repositories/recebimento/recebimento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  divergenciasRecebimento,
  itensRecebimento,
  recebimentos,
  unitizadores,
} from '../providers/drizzle/config/migrations/schema.js';
import {
  mapDivergenciaRow,
  mapItemRecebimentoRow,
  mapRecebimentoRow,
} from './map-recebimento.drizzle.js';

export async function findRecebimentoByIdDb(
  db: DrizzleClient,
  id: string,
): Promise<RecebimentoWithDetails | null> {
  const [recebimento] = await db
    .select()
    .from(recebimentos)
    .where(eq(recebimentos.id, id))
    .limit(1);

  if (!recebimento) {
    return null;
  }

  const itens = await db
    .select({
      item: itensRecebimento,
      unitizadorCodigo: unitizadores.codigo,
    })
    .from(itensRecebimento)
    .leftJoin(
      unitizadores,
      eq(itensRecebimento.unitizadorId, unitizadores.id),
    )
    .where(eq(itensRecebimento.recebimentoId, id));

  const divergencias = await db
    .select()
    .from(divergenciasRecebimento)
    .where(eq(divergenciasRecebimento.recebimentoId, id));

  return {
    ...mapRecebimentoRow(recebimento),
    itens: itens.map(({ item, unitizadorCodigo }) => ({
      ...mapItemRecebimentoRow(item),
      unitizadorCodigo: unitizadorCodigo ?? null,
    })),
    divergencias: divergencias.map(mapDivergenciaRow),
  };
}

export async function findRecebimentoByPreRecebimentoIdDb(
  db: DrizzleClient,
  preRecebimentoId: string,
): Promise<RecebimentoWithDetails | null> {
  const [recebimento] = await db
    .select()
    .from(recebimentos)
    .where(eq(recebimentos.preRecebimentoId, preRecebimentoId))
    .limit(1);

  if (!recebimento) {
    return null;
  }

  return findRecebimentoByIdDb(db, recebimento.id);
}
