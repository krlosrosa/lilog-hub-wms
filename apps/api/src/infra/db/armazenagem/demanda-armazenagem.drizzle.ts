import { and, count, desc, eq } from 'drizzle-orm';

import type { CreateDemandaArmazenagemInput } from '../../../domain/model/armazenagem/armazenagem.model.js';
import type {
  DemandaArmazenagemWithItens,
  ListDemandasArmazenagemFilter,
  ListDemandasArmazenagemResult,
} from '../../../domain/repositories/armazenagem/armazenagem.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasArmazenagem,
  enderecos,
  itensArmazenagem,
  produtos,
} from '../providers/drizzle/config/migrations/schema.js';
import {
  mapDemandaArmazenagemRow,
  mapItemArmazenagemRow,
} from './map-armazenagem.drizzle.js';

async function loadItensWithEnrichment(
  db: DrizzleClient,
  demandaId: string,
) {
  const rows = await db
    .select({
      item: itensArmazenagem,
      produtoSku: produtos.sku,
      produtoNome: produtos.descricao,
      enderecoSugeridoLabel: enderecos.enderecoMascarado,
    })
    .from(itensArmazenagem)
    .leftJoin(produtos, eq(itensArmazenagem.produtoId, produtos.id))
    .leftJoin(
      enderecos,
      eq(itensArmazenagem.enderecoSugeridoId, enderecos.id),
    )
    .where(eq(itensArmazenagem.demandaId, demandaId));

  return rows.map((row) =>
    mapItemArmazenagemRow(row.item, {
      produtoSku: row.produtoSku,
      produtoNome: row.produtoNome,
      enderecoSugeridoLabel: row.enderecoSugeridoLabel,
    }),
  );
}

export async function criarDemandaArmazenagemDb(
  db: DrizzleClient,
  input: CreateDemandaArmazenagemInput,
): Promise<DemandaArmazenagemWithItens> {
  const [demanda] = await db
    .insert(demandasArmazenagem)
    .values({
      unidadeId: input.unidadeId,
      recebimentoId: input.recebimentoId,
      modoUnitizacao: input.modoUnitizacao,
      status: 'aguardando_inicio',
    })
    .returning();

  if (!demanda) {
    throw new Error('Failed to insert demanda armazenagem');
  }

  const itemRows = await db
    .insert(itensArmazenagem)
    .values(
      input.itens.map((item) => ({
        demandaId: demanda.id,
        unitizadorId: item.unitizadorId,
        produtoId: item.produtoId,
        quantidade: String(item.quantidade),
        unidadeMedida: item.unidadeMedida,
        lote: item.lote,
        validade: item.validade,
        numeroSerie: item.numeroSerie,
        enderecoSugeridoId: item.enderecoSugeridoId ?? null,
        status: 'pendente' as const,
      })),
    )
    .returning();

  return {
    ...mapDemandaArmazenagemRow(demanda),
    itens: itemRows.map((row) => mapItemArmazenagemRow(row)),
  };
}

export async function findDemandaByRecebimentoIdDb(
  db: DrizzleClient,
  recebimentoId: string,
): Promise<DemandaArmazenagemWithItens | null> {
  const [demanda] = await db
    .select()
    .from(demandasArmazenagem)
    .where(eq(demandasArmazenagem.recebimentoId, recebimentoId))
    .limit(1);

  if (!demanda) {
    return null;
  }

  const itens = await loadItensWithEnrichment(db, demanda.id);

  return {
    ...mapDemandaArmazenagemRow(demanda),
    itens,
  };
}

export async function findDemandaByIdDb(
  db: DrizzleClient,
  id: string,
): Promise<DemandaArmazenagemWithItens | null> {
  const [demanda] = await db
    .select()
    .from(demandasArmazenagem)
    .where(eq(demandasArmazenagem.id, id))
    .limit(1);

  if (!demanda) {
    return null;
  }

  const itens = await loadItensWithEnrichment(db, demanda.id);

  return {
    ...mapDemandaArmazenagemRow(demanda),
    itens,
  };
}

export async function findItemArmazenagemByIdDb(
  db: DrizzleClient,
  id: string,
) {
  const [row] = await db
    .select()
    .from(itensArmazenagem)
    .where(eq(itensArmazenagem.id, id))
    .limit(1);

  return row ? mapItemArmazenagemRow(row) : null;
}

export async function listDemandasArmazenagemDb(
  db: DrizzleClient,
  filter: ListDemandasArmazenagemFilter,
): Promise<ListDemandasArmazenagemResult> {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = [eq(demandasArmazenagem.unidadeId, filter.unidadeId)];

  if (filter.status) {
    conditions.push(eq(demandasArmazenagem.status, filter.status));
  }

  if (filter.responsavelId !== undefined) {
    conditions.push(
      eq(demandasArmazenagem.responsavelId, filter.responsavelId),
    );
  }

  const whereClause = and(...conditions);

  const [rows, [totalRow]] = await Promise.all([
    db
      .select()
      .from(demandasArmazenagem)
      .where(whereClause)
      .orderBy(desc(demandasArmazenagem.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(demandasArmazenagem)
      .where(whereClause),
  ]);

  return {
    items: rows.map(mapDemandaArmazenagemRow),
    total: totalRow?.total ?? 0,
    page,
    limit,
  };
}

export async function updateStatusDemandaDb(
  db: DrizzleClient,
  id: string,
  status: DemandaArmazenagemWithItens['status'],
  extra?: {
    responsavelId?: number;
    startedAt?: Date;
    finishedAt?: Date;
  },
) {
  const [record] = await db
    .update(demandasArmazenagem)
    .set({
      status,
      responsavelId: extra?.responsavelId,
      startedAt: extra?.startedAt,
      finishedAt: extra?.finishedAt,
      updatedAt: new Date(),
    })
    .where(eq(demandasArmazenagem.id, id))
    .returning();

  return record ? mapDemandaArmazenagemRow(record) : null;
}

export async function updateStatusItemArmazenagemDb(
  db: DrizzleClient,
  id: string,
  status: DemandaArmazenagemWithItens['itens'][number]['status'],
  enderecoConfirmadoId?: string,
  unitizadorId?: string,
  quantidade?: number,
) {
  const [record] = await db
    .update(itensArmazenagem)
    .set({
      status,
      enderecoConfirmadoId,
      unitizadorId,
      ...(quantidade !== undefined && {
        quantidade: quantidade.toFixed(4),
      }),
      updatedAt: new Date(),
    })
    .where(eq(itensArmazenagem.id, id))
    .returning();

  return record ? mapItemArmazenagemRow(record) : null;
}

export async function updateItemQuantidadeArmazenagemDb(
  db: DrizzleClient,
  id: string,
  quantidade: number,
) {
  const [record] = await db
    .update(itensArmazenagem)
    .set({
      quantidade: quantidade.toFixed(4),
      updatedAt: new Date(),
    })
    .where(eq(itensArmazenagem.id, id))
    .returning();

  return record ? mapItemArmazenagemRow(record) : null;
}
