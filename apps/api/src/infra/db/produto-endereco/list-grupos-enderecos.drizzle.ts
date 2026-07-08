import { and, eq, isNotNull, ne } from 'drizzle-orm';

import type { GrupoComEnderecosRecord } from '../../../domain/repositories/produto-endereco/produto-endereco.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  produtoEnderecos,
  produtos,
} from '../providers/drizzle/config/migrations/schema.js';

export async function listGruposEnderecosDb(
  db: DrizzleClient,
  centroId: string,
): Promise<GrupoComEnderecosRecord[]> {
  const rows = await db
    .select({
      grupo: produtos.grupo,
      enderecoId: produtoEnderecos.enderecoId,
    })
    .from(produtoEnderecos)
    .innerJoin(produtos, eq(produtoEnderecos.produtoId, produtos.produtoId))
    .where(
      and(
        eq(produtoEnderecos.centroId, centroId),
        eq(produtoEnderecos.ativo, true),
        isNotNull(produtos.grupo),
        ne(produtos.grupo, ''),
      ),
    );

  const byGrupo = new Map<string, Set<string>>();

  for (const row of rows) {
    const grupo = row.grupo!.trim();
    if (!grupo) continue;

    let ids = byGrupo.get(grupo);
    if (!ids) {
      ids = new Set<string>();
      byGrupo.set(grupo, ids);
    }
    ids.add(row.enderecoId);
  }

  return [...byGrupo.entries()]
    .map(([grupo, enderecoIds]) => ({
      grupo,
      enderecoIds: [...enderecoIds],
    }))
    .sort((a, b) => a.grupo.localeCompare(b.grupo, 'pt-BR'));
}
