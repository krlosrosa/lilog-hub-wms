import { and, eq, ilike, inArray } from 'drizzle-orm';

import type { ResolvedEnderecoCandidate } from '../../../domain/repositories/inventario/inventario.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  centros,
  enderecos,
  produtos,
  saldosEndereco,
} from '../providers/drizzle/config/migrations/schema.js';

export async function findEnderecosByIdsForCentroDb(
  db: DrizzleClient,
  centroId: string,
  enderecoIds: string[],
  skuBusca?: string,
): Promise<ResolvedEnderecoCandidate[]> {
  if (enderecoIds.length === 0) {
    return [];
  }

  const [centro] = await db
    .select({ unidadeId: centros.unidadeId })
    .from(centros)
    .where(eq(centros.id, centroId))
    .limit(1);

  if (!centro) {
    return [];
  }

  const sku = skuBusca?.trim();

  if (sku) {
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
          inArray(enderecos.id, enderecoIds),
          ilike(produtos.sku, `%${sku}%`),
        ),
      )
      .orderBy(enderecos.enderecoMascarado);

    return rows;
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
        inArray(enderecos.id, enderecoIds),
      ),
    )
    .orderBy(enderecos.enderecoMascarado);

  return rows;
}
