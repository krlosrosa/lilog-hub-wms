import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  or,
  type SQL,
} from 'drizzle-orm';

import type { ListProdutoEnderecosFilter } from '../../../domain/repositories/produto-endereco/produto-endereco.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  centros,
  enderecos,
  produtoEnderecos,
  produtos,
  unidades,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapProdutoEnderecoRow } from './map-produto-endereco.drizzle.js';

export async function listProdutoEnderecosDb(
  db: DrizzleClient,
  filter: ListProdutoEnderecosFilter,
) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];

  if (filter.centroId) {
    conditions.push(eq(produtoEnderecos.centroId, filter.centroId));
  }

  if (filter.unidadeId) {
    conditions.push(eq(centros.unidadeId, filter.unidadeId));
  }

  if (filter.produtoId) {
    conditions.push(eq(produtoEnderecos.produtoId, filter.produtoId));
  }

  if (filter.papel) {
    conditions.push(eq(produtoEnderecos.papel, filter.papel));
  }

  if (filter.ativo !== undefined) {
    conditions.push(eq(produtoEnderecos.ativo, filter.ativo));
  }

  if (filter.search?.trim()) {
    const term = `%${filter.search.trim()}%`;
    conditions.push(
      or(
        ilike(produtos.sku, term),
        ilike(produtos.descricao, term),
        ilike(produtos.produtoId, term),
        ilike(enderecos.enderecoMascarado, term),
      )!,
    );
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  const baseQuery = db
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
    .innerJoin(unidades, eq(centros.unidadeId, unidades.id));

  const [countRow] = await db
    .select({ total: count() })
    .from(produtoEnderecos)
    .innerJoin(produtos, eq(produtoEnderecos.produtoId, produtos.id))
    .innerJoin(enderecos, eq(produtoEnderecos.enderecoId, enderecos.id))
    .innerJoin(centros, eq(produtoEnderecos.centroId, centros.id))
    .where(whereClause);

  const rows = await baseQuery
    .where(whereClause)
    .orderBy(
      asc(produtos.sku),
      asc(produtoEnderecos.ordem),
      desc(produtoEnderecos.createdAt),
    )
    .limit(limit)
    .offset(offset);

  return {
    items: rows.map((row) =>
      mapProdutoEnderecoRow(
        row.alocacao,
        row.produto,
        row.endereco,
        row.centro,
      ),
    ),
    total: Number(countRow?.total ?? 0),
    page,
    limit,
  };
}
