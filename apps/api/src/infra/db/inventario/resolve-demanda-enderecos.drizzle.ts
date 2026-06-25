import { and, eq, inArray } from 'drizzle-orm';

import type { DemandaFiltros } from '../../../domain/model/inventario/inventario.model.js';
import type { ResolvedEnderecoCandidate } from '../../../domain/repositories/inventario/inventario.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { enderecos } from '../providers/drizzle/config/migrations/schema.js';
import { parseRackSegment, rackInRange } from './parse-rack.js';

export async function resolveDemandaEnderecosDb(
  db: DrizzleClient,
  centroId: string,
  filtros: DemandaFiltros,
): Promise<ResolvedEnderecoCandidate[]> {
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
        inArray(enderecos.zona, filtros.zonas),
      ),
    )
    .orderBy(enderecos.enderecoMascarado);

  return rows.filter((row) => {
    const rack = parseRackSegment(row.enderecoMascarado);
    if (!rack) return false;
    return rackInRange(rack, filtros.rackInicio, filtros.rackFim);
  });
}
