import { and, eq, ilike, inArray } from 'drizzle-orm';

import type { DemandaFiltros } from '../../../domain/model/inventario/inventario.model.js';
import type { ResolvedEnderecoCandidate } from '../../../domain/repositories/inventario/inventario.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  centros,
  enderecos,
  produtos,
  saldosEndereco,
} from '../providers/drizzle/config/migrations/schema.js';
import { parseRackSegment, rackInRange } from './parse-rack.js';

function filterByRack(
  rows: ResolvedEnderecoCandidate[],
  rackInicio?: string,
  rackFim?: string,
): ResolvedEnderecoCandidate[] {
  return rows.filter((row) => {
    const rack = parseRackSegment(row.enderecoMascarado);
    if (!rack) return false;
    return rackInRange(rack, rackInicio, rackFim);
  });
}

export async function resolveDemandaEnderecosDb(
  db: DrizzleClient,
  centroId: string,
  filtros: DemandaFiltros,
): Promise<ResolvedEnderecoCandidate[]> {
  const [centro] = await db
    .select({ unidadeId: centros.unidadeId })
    .from(centros)
    .where(eq(centros.id, centroId))
    .limit(1);

  if (!centro) {
    return [];
  }

  const skuBusca = filtros.skuBusca?.trim();

  if (skuBusca) {
    const rows = await db
      .selectDistinct({
        id: enderecos.id,
        enderecoMascarado: enderecos.enderecoMascarado,
        zona: enderecos.zona,
      })
      .from(enderecos)
      .innerJoin(saldosEndereco, eq(saldosEndereco.enderecoId, enderecos.id))
      .innerJoin(produtos, eq(produtos.produtoId, saldosEndereco.produtoId))
      .where(
        and(
          eq(enderecos.unidadeId, centro.unidadeId),
          eq(saldosEndereco.unidadeId, centro.unidadeId),
          eq(saldosEndereco.natureza, 'fisico'),
          inArray(enderecos.zona, filtros.zonas),
          ilike(produtos.sku, `%${skuBusca}%`),
        ),
      )
      .orderBy(enderecos.enderecoMascarado);

    return filterByRack(rows, filtros.rackInicio, filtros.rackFim);
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
        eq(enderecos.unidadeId, centro.unidadeId),
        inArray(enderecos.zona, filtros.zonas),
      ),
    )
    .orderBy(enderecos.enderecoMascarado);

  return filterByRack(rows, filtros.rackInicio, filtros.rackFim);
}
