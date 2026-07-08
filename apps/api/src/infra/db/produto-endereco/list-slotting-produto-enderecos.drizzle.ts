import {
  and,
  asc,
  count,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import type {
  ListSlottingProdutoEnderecosFilter,
  SlottingEnderecoRecord,
  SlottingSortColumn,
  SlottingSortOrder,
} from '../../../domain/repositories/produto-endereco/produto-endereco.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  centros,
  enderecos,
  produtoEnderecos,
  produtos,
} from '../providers/drizzle/config/migrations/schema.js';

function buildSlottingConditions(
  filter: ListSlottingProdutoEnderecosFilter,
  primaryAlloc: ReturnType<typeof buildPrimaryAllocSubquery>,
): SQL[] {
  const conditions: SQL[] = [eq(centros.id, filter.centroId)];

  if (filter.unidadeId) {
    conditions.push(eq(enderecos.unidadeId, filter.unidadeId));
  }

  if (filter.tipo) {
    conditions.push(eq(enderecos.tipo, filter.tipo));
  }

  if (filter.zonas && filter.zonas.length > 0) {
    conditions.push(inArray(enderecos.zona, filter.zonas));
  }

  if (filter.search?.trim()) {
    const term = `%${filter.search.trim()}%`;
    conditions.push(
      or(
        ilike(enderecos.enderecoMascarado, term),
        ilike(enderecos.zona, term),
        ilike(enderecos.rua, term),
      )!,
    );
  }

  if (filter.slotting === 'com_produto') {
    conditions.push(isNotNull(primaryAlloc.id));
  }

  if (filter.slotting === 'sem_produto') {
    conditions.push(isNull(primaryAlloc.id));
  }

  if (filter.papel) {
    conditions.push(eq(primaryAlloc.papel, filter.papel));
  }

  if (filter.ativo === 'ativos') {
    conditions.push(eq(primaryAlloc.ativo, true));
  }

  if (filter.ativo === 'inativos') {
    conditions.push(eq(primaryAlloc.ativo, false));
  }

  if (filter.searchProduto?.trim()) {
    const term = `%${filter.searchProduto.trim()}%`;
    conditions.push(
      or(
        ilike(produtos.sku, term),
        ilike(produtos.descricao, term),
        ilike(produtos.produtoId, term),
      )!,
    );
  }

  return conditions;
}

function buildPrimaryAllocSubquery(db: DrizzleClient, centroId: string) {
  return db
    .selectDistinctOn([produtoEnderecos.enderecoId], {
      id: produtoEnderecos.id,
      enderecoId: produtoEnderecos.enderecoId,
      produtoId: produtoEnderecos.produtoId,
      papel: produtoEnderecos.papel,
      ordem: produtoEnderecos.ordem,
      ativo: produtoEnderecos.ativo,
    })
    .from(produtoEnderecos)
    .where(eq(produtoEnderecos.centroId, centroId))
    .orderBy(
      produtoEnderecos.enderecoId,
      sql`CASE WHEN ${produtoEnderecos.ativo} THEN 0 ELSE 1 END`,
      sql`CASE ${produtoEnderecos.papel} WHEN 'picking_primario' THEN 0 WHEN 'picking_secundario' THEN 1 ELSE 2 END`,
      asc(produtoEnderecos.ordem),
    )
    .as('primary_alloc');
}

function buildSlottingOrderBy(
  sortBy: SlottingSortColumn,
  sortOrder: SlottingSortOrder,
  primaryAlloc: ReturnType<typeof buildPrimaryAllocSubquery>,
) {
  const direction = sortOrder === 'desc' ? 'desc' : 'asc';
  const nullsLast = `${direction} nulls last`;

  switch (sortBy) {
    case 'endereco':
      return [sql`${enderecos.enderecoMascarado} ${sql.raw(direction)}`];
    case 'zona':
      return [
        sql`${enderecos.zona} ${sql.raw(direction)}`,
        sql`${enderecos.rua} ${sql.raw(direction)}`,
      ];
    case 'tipo':
      return [sql`${enderecos.tipo} ${sql.raw(direction)}`];
    case 'produto':
      return [sql`${produtos.sku} ${sql.raw(nullsLast)}`];
    case 'papel':
      return [sql`${primaryAlloc.papel} ${sql.raw(nullsLast)}`];
    case 'ordem':
      return [sql`${primaryAlloc.ordem} ${sql.raw(nullsLast)}`];
    case 'status':
      return [sql`${primaryAlloc.ativo} ${sql.raw(nullsLast)}`];
    default:
      return [sql`${enderecos.enderecoMascarado} asc`];
  }
}

export async function listSlottingProdutoEnderecosDb(
  db: DrizzleClient,
  filter: ListSlottingProdutoEnderecosFilter,
) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;
  const sortBy = filter.sortBy ?? 'endereco';
  const sortOrder = filter.sortOrder ?? 'asc';

  const primaryAlloc = buildPrimaryAllocSubquery(db, filter.centroId);
  const conditions = buildSlottingConditions(filter, primaryAlloc);
  const whereClause = and(...conditions);

  const baseFrom = db
    .select({
      enderecoId: enderecos.id,
      enderecoMascarado: enderecos.enderecoMascarado,
      zona: enderecos.zona,
      rua: enderecos.rua,
      tipo: enderecos.tipo,
      alocacaoId: primaryAlloc.id,
      produtoId: primaryAlloc.produtoId,
      papel: primaryAlloc.papel,
      ordem: primaryAlloc.ordem,
      ativo: primaryAlloc.ativo,
      produtoSku: produtos.sku,
      produtoDescricao: produtos.descricao,
      produtoCodigo: produtos.produtoId,
    })
    .from(enderecos)
    .innerJoin(centros, eq(centros.unidadeId, enderecos.unidadeId))
    .leftJoin(primaryAlloc, eq(enderecos.id, primaryAlloc.enderecoId))
    .leftJoin(produtos, eq(primaryAlloc.produtoId, produtos.produtoId))
    .where(whereClause);

  const [countRow] = await db
    .select({ total: count() })
    .from(enderecos)
    .innerJoin(centros, eq(centros.unidadeId, enderecos.unidadeId))
    .leftJoin(primaryAlloc, eq(enderecos.id, primaryAlloc.enderecoId))
    .leftJoin(produtos, eq(primaryAlloc.produtoId, produtos.produtoId))
    .where(whereClause);

  const rows = await baseFrom
    .orderBy(...buildSlottingOrderBy(sortBy, sortOrder, primaryAlloc))
    .limit(limit)
    .offset(offset);

  const items: SlottingEnderecoRecord[] = rows.map((row) => ({
    enderecoId: row.enderecoId,
    enderecoMascarado: row.enderecoMascarado,
    zona: row.zona,
    rua: row.rua,
    tipo: row.tipo,
    alocacao: row.alocacaoId
      ? {
          id: row.alocacaoId,
          produtoId: row.produtoId!,
          papel: row.papel!,
          ordem: row.ordem!,
          ativo: row.ativo!,
          produto: {
            sku: row.produtoSku!,
            descricao: row.produtoDescricao!,
            produtoId: row.produtoCodigo!,
          },
        }
      : null,
  }));

  return {
    items,
    total: Number(countRow?.total ?? 0),
    page,
    limit,
  };
}
