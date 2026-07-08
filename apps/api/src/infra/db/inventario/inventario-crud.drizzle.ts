import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';

import type { CreateInventarioInput } from '../../../domain/model/inventario/inventario.model.js';
import type {
  InventarioDetalheRecord,
  InventarioKpiRecord,
  InventarioRecord,
  InventarioTrendRecord,
  ListInventariosFilter,
} from '../../../domain/repositories/inventario/inventario.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandaEnderecos,
  demandasContagem,
  inventarios,
  users,
} from '../providers/drizzle/config/migrations/schema.js';
import {
  generateInventarioCodigo,
  mapInventarioDetalhe,
  mapInventarioRow,
} from './map-inventario.drizzle.js';
import { listInventarioDivergenciasDb } from './inventario-divergencias.drizzle.js';

export async function createInventarioDb(
  db: DrizzleClient,
  data: CreateInventarioInput,
): Promise<InventarioRecord> {
  const [row] = await db
    .insert(inventarios)
    .values({
      codigo: generateInventarioCodigo(),
      nome: data.nome.trim(),
      tipo: data.tipo,
      dataProgramada: data.dataProgramada,
      centroId: data.centroId,
      responsavelGestorId: data.responsavelGestorId ?? null,
    })
    .returning();

  if (!row) {
    throw new Error('Failed to create inventario');
  }

  return mapInventarioRow(row);
}

export async function findInventarioByIdDb(
  db: DrizzleClient,
  id: string,
): Promise<InventarioRecord | null> {
  const rows = await db
    .select({
      inventario: inventarios,
      gestorNome: users.name,
    })
    .from(inventarios)
    .leftJoin(users, eq(inventarios.responsavelGestorId, users.id))
    .where(eq(inventarios.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return mapInventarioRow(row.inventario, row.gestorNome);
}

export async function listInventariosDb(
  db: DrizzleClient,
  filter: ListInventariosFilter,
) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;
  const conditions: SQL[] = [];

  if (filter.status) {
    conditions.push(eq(inventarios.status, filter.status));
  }

  if (filter.search?.trim()) {
    const term = `%${filter.search.trim()}%`;
    conditions.push(
      or(
        ilike(inventarios.codigo, term),
        ilike(inventarios.nome, term),
      )!,
    );
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      inventario: inventarios,
      gestorNome: users.name,
    })
    .from(inventarios)
    .leftJoin(users, eq(inventarios.responsavelGestorId, users.id))
    .where(whereClause)
    .orderBy(desc(inventarios.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(inventarios)
    .where(whereClause);

  return {
    items: rows.map(({ inventario, gestorNome }) =>
      mapInventarioRow(inventario, gestorNome),
    ),
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  };
}

export async function updateInventarioStatusDb(
  db: DrizzleClient,
  id: string,
  status: InventarioRecord['status'],
): Promise<InventarioRecord | null> {
  const patch: Partial<typeof inventarios.$inferInsert> = {
    status,
    updatedAt: new Date(),
  };

  if (status === 'em_progresso') {
    patch.startedAt = new Date();
    patch.pausedAt = null;
  }

  if (status === 'pausado') {
    patch.pausedAt = new Date();
  }

  if (status === 'concluido') {
    patch.finishedAt = new Date();
    patch.pausedAt = null;
  }

  const [row] = await db
    .update(inventarios)
    .set(patch)
    .where(eq(inventarios.id, id))
    .returning();

  if (!row) return null;

  return findInventarioByIdDb(db, row.id);
}

export async function iniciarInventarioDb(
  db: DrizzleClient,
  id: string,
): Promise<InventarioRecord | null> {
  await db
    .update(demandasContagem)
    .set({
      status: 'em_andamento',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(demandasContagem.inventarioId, id),
        eq(demandasContagem.ativo, true),
        eq(demandasContagem.status, 'aguardando_inicio'),
      ),
    );

  return updateInventarioStatusDb(db, id, 'em_progresso');
}

export async function getInventarioKpiDb(
  db: DrizzleClient,
): Promise<InventarioKpiRecord> {
  const [stats] = await db
    .select({
      totalEnderecos: sql<number>`count(${demandaEnderecos.id})::int`,
      conferidos: sql<number>`count(*) filter (where ${demandaEnderecos.status} = 'conferido')::int`,
      emProgresso: sql<number>`count(*) filter (where ${inventarios.status} = 'em_progresso')::int`,
    })
    .from(demandaEnderecos)
    .innerJoin(
      demandasContagem,
      eq(demandaEnderecos.demandaId, demandasContagem.id),
    )
    .innerJoin(inventarios, eq(demandasContagem.inventarioId, inventarios.id));

  const total = stats?.totalEnderecos ?? 0;
  const conferidos = stats?.conferidos ?? 0;

  return {
    acuraciaGlobal: 0,
    acuraciaDeltaPercent: 0,
    itensInventariados: conferidos,
    itensMeta: total,
    divergenciasTotal: 0,
    divergenciasDelta: 0,
    statusAtualLabel:
      (stats?.emProgresso ?? 0) > 0 ? 'Em progresso' : 'Aguardando',
    tempoEstimadoLabel: null,
  };
}

export async function getInventarioTrendDb(
  db: DrizzleClient,
): Promise<InventarioTrendRecord[]> {
  const rows = await db
    .select({
      mes: sql<string>`to_char(${inventarios.finishedAt}, 'Mon')`,
      total: sql<number>`count(*)::int`,
      concluidos: sql<number>`count(*) filter (where ${inventarios.status} = 'concluido')::int`,
    })
    .from(inventarios)
    .where(sql`${inventarios.finishedAt} is not null`)
    .groupBy(sql`to_char(${inventarios.finishedAt}, 'Mon')`)
    .orderBy(sql`min(${inventarios.finishedAt})`)
    .limit(6);

  return rows.map((row) => ({
    mes: row.mes,
    valorPercent:
      row.total > 0 ? Math.round((row.concluidos / row.total) * 100) : 0,
  }));
}

export async function getInventarioDetalheDb(
  db: DrizzleClient,
  id: string,
): Promise<InventarioDetalheRecord | null> {
  const inventario = await findInventarioByIdDb(db, id);
  if (!inventario) return null;

  const [totals] = await db
    .select({
      total: sql<number>`count(${demandaEnderecos.id})::int`,
      conferidos: sql<number>`count(*) filter (where ${demandaEnderecos.status} = 'conferido')::int`,
    })
    .from(demandaEnderecos)
    .innerJoin(
      demandasContagem,
      eq(demandaEnderecos.demandaId, demandasContagem.id),
    )
    .where(eq(demandasContagem.inventarioId, id));

  const setoresRows = await db
    .select({
      demandaId: demandasContagem.id,
      filtros: demandasContagem.filtros,
      total: sql<number>`count(${demandaEnderecos.id})::int`,
      conferidos: sql<number>`count(*) filter (where ${demandaEnderecos.status} = 'conferido')::int`,
    })
    .from(demandaEnderecos)
    .innerJoin(
      demandasContagem,
      eq(demandaEnderecos.demandaId, demandasContagem.id),
    )
    .where(eq(demandasContagem.inventarioId, id))
    .groupBy(demandasContagem.id, demandasContagem.filtros);

  const setoresProgresso = setoresRows.map((row) => {
    const nome = row.filtros.zonas.join(', ') || 'Demanda';
    const skuTotal = row.total;
    const skuContados = row.conferidos;
    return {
      id: row.demandaId,
      nome,
      progressPercent:
        skuTotal > 0 ? Math.round((skuContados / skuTotal) * 100) : 0,
      skuContados,
      skuTotal,
    };
  });

  const divergencias = await listInventarioDivergenciasDb(db, id);

  return mapInventarioDetalhe(
    inventario,
    totals?.conferidos ?? 0,
    totals?.total ?? 0,
    setoresProgresso,
    divergencias,
  );
}
