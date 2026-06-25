import { and, eq, inArray } from 'drizzle-orm';

import type { ResolvedEnderecoCandidate } from '../../../domain/repositories/inventario/inventario.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { enderecos } from '../providers/drizzle/config/migrations/schema.js';

export async function findEnderecosByIdsForCentroDb(
  db: DrizzleClient,
  centroId: string,
  enderecoIds: string[],
): Promise<ResolvedEnderecoCandidate[]> {
  if (enderecoIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: enderecos.id,
      enderecoMascarado: enderecos.enderecoMascarado,
      zona: enderecos.zona,
    })
    .from(enderecos)
    .where(
      and(
        eq(enderecos.centroId, centroId),
        inArray(enderecos.id, enderecoIds),
      ),
    )
    .orderBy(enderecos.enderecoMascarado);

  return rows;
}
