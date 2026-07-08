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
  unitizadores,
} from '../providers/drizzle/config/migrations/schema.js';
import { criarDemandaComTarefasTransacionalDb } from './criar-demanda-com-tarefas.drizzle.js';
import {
  mapDemandaArmazenagemRow,
  mapItemArmazenagemRow,
} from './map-armazenagem.drizzle.js';
import { loadTarefasWithItensByDemandaIdDb } from './tarefa-armazenagem.drizzle.js';

async function loadItensWithEnrichment(
  db: DrizzleClient,
  demandaId: string,
) {
  const rows = await db
    .select({
      item: itensArmazenagem,
      produtoSku: produtos.sku,
      produtoNome: produtos.descricao,
      unitizadorCodigo: unitizadores.codigo,
      enderecoSugeridoLabel: enderecos.enderecoMascarado,
    })
    .from(itensArmazenagem)
    .leftJoin(produtos, eq(itensArmazenagem.produtoId, produtos.produtoId))
    .leftJoin(unitizadores, eq(itensArmazenagem.unitizadorId, unitizadores.id))
    .leftJoin(
      enderecos,
      eq(itensArmazenagem.enderecoSugeridoId, enderecos.id),
    )
    .where(eq(itensArmazenagem.demandaId, demandaId));

  return rows.map((row) =>
    mapItemArmazenagemRow(row.item, {
      produtoSku: row.produtoSku,
      produtoNome: row.produtoNome,
      unitizadorCodigo: row.unitizadorCodigo,
      enderecoSugeridoLabel: row.enderecoSugeridoLabel,
    }),
  );
}

async function loadDemandaCompleta(
  db: DrizzleClient,
  demanda: typeof demandasArmazenagem.$inferSelect,
): Promise<DemandaArmazenagemWithItens> {
  const [itens, tarefas] = await Promise.all([
    loadItensWithEnrichment(db, demanda.id),
    loadTarefasWithItensByDemandaIdDb(db, demanda.id),
  ]);

  return {
    ...mapDemandaArmazenagemRow(demanda),
    itens,
    tarefas,
  };
}

export async function criarDemandaArmazenagemDb(
  db: DrizzleClient,
  input: CreateDemandaArmazenagemInput,
): Promise<DemandaArmazenagemWithItens> {
  const created = await criarDemandaComTarefasTransacionalDb(db, {
    demanda: input,
  });

  const reloaded = await findDemandaByIdDb(db, created.id);

  return reloaded ?? created;
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

  return loadDemandaCompleta(db, demanda);
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

  return loadDemandaCompleta(db, demanda);
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
    validadoPor?: number;
    validadoEm?: Date;
  },
) {
  const [record] = await db
    .update(demandasArmazenagem)
    .set({
      status,
      responsavelId: extra?.responsavelId,
      startedAt: extra?.startedAt,
      finishedAt: extra?.finishedAt,
      validadoPor: extra?.validadoPor,
      validadoEm: extra?.validadoEm,
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
