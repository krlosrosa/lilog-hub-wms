import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  centros,
  enderecos,
  produtoEnderecos,
  produtos,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapProdutoEnderecoRow } from './map-produto-endereco.drizzle.js';

export async function findProdutoEnderecoByIdDb(db: DrizzleClient, id: string) {
  const rows = await db
    .select({
      alocacao: produtoEnderecos,
      produto: produtos,
      endereco: enderecos,
      centro: centros,
    })
    .from(produtoEnderecos)
    .innerJoin(produtos, eq(produtoEnderecos.produtoId, produtos.id))
    .innerJoin(enderecos, eq(produtoEnderecos.enderecoId, enderecos.id))
    .innerJoin(centros, eq(produtoEnderecos.centroId, centros.id))
    .where(eq(produtoEnderecos.id, id))
    .limit(1);

  const row = rows[0];

  if (!row) {
    return null;
  }

  return mapProdutoEnderecoRow(
    row.alocacao,
    row.produto,
    row.endereco,
    row.centro,
  );
}
