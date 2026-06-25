import { and, eq, notInArray, sql } from 'drizzle-orm';

import type { CreateDemandaContagemInput } from '../../../domain/model/inventario/inventario.model.js';
import type {
  DemandaContagemRecord,
  DemandaEnderecoRecord,
} from '../../../domain/repositories/inventario/inventario.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandaEnderecos,
  demandasContagem,
  enderecos,
  inventarios,
  users,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapDemandaEnderecoRow, mapDemandaRow } from './map-inventario.drizzle.js';

async function loadDemandaWithCounts(
  db: DrizzleClient,
  demandaId: string,
): Promise<DemandaContagemRecord | null> {
  const rows = await db
    .select({
      demanda: demandasContagem,
      responsavelNome: users.name,
      totalEnderecos: sql<number>`count(${demandaEnderecos.id})::int`,
      enderecosConferidos: sql<number>`count(*) filter (where ${demandaEnderecos.status} = 'conferido')::int`,
    })
    .from(demandasContagem)
    .innerJoin(users, eq(demandasContagem.responsavelId, users.id))
    .leftJoin(demandaEnderecos, eq(demandaEnderecos.demandaId, demandasContagem.id))
    .where(eq(demandasContagem.id, demandaId))
    .groupBy(demandasContagem.id, users.name)
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return mapDemandaRow(
    row.demanda,
    row.responsavelNome,
    row.totalEnderecos,
    row.enderecosConferidos,
  );
}

export async function createDemandaDb(
  db: DrizzleClient,
  data: CreateDemandaContagemInput,
  enderecoIds: string[],
): Promise<DemandaContagemRecord> {
  const [demanda] = await db
    .insert(demandasContagem)
    .values({
      inventarioId: data.inventarioId,
      nome: data.nome.trim(),
      tipo: data.tipo,
      prioridade: data.prioridade,
      responsavelId: data.responsavelId,
      ativo: data.ativo,
      filtros: data.filtros,
      observacoes: data.observacoes,
      alertaFragilidade: data.alertaFragilidade,
    })
    .returning();

  if (!demanda) {
    throw new Error('Failed to create demanda');
  }

  if (enderecoIds.length > 0) {
    await db.insert(demandaEnderecos).values(
      enderecoIds.map((enderecoId, index) => ({
        demandaId: demanda.id,
        enderecoId,
        sequence: index + 1,
      })),
    );
  }

  const created = await loadDemandaWithCounts(db, demanda.id);
  if (!created) {
    throw new Error('Failed to load created demanda');
  }

  return created;
}

export async function listDemandasByInventarioDb(
  db: DrizzleClient,
  inventarioId: string,
): Promise<DemandaContagemRecord[]> {
  const rows = await db
    .select({
      demanda: demandasContagem,
      responsavelNome: users.name,
      totalEnderecos: sql<number>`count(${demandaEnderecos.id})::int`,
      enderecosConferidos: sql<number>`count(*) filter (where ${demandaEnderecos.status} = 'conferido')::int`,
    })
    .from(demandasContagem)
    .innerJoin(users, eq(demandasContagem.responsavelId, users.id))
    .leftJoin(demandaEnderecos, eq(demandaEnderecos.demandaId, demandasContagem.id))
    .where(eq(demandasContagem.inventarioId, inventarioId))
    .groupBy(demandasContagem.id, users.name)
    .orderBy(demandasContagem.createdAt);

  return rows.map((row) =>
    mapDemandaRow(
      row.demanda,
      row.responsavelNome,
      row.totalEnderecos,
      row.enderecosConferidos,
    ),
  );
}

export async function findDemandaByIdDb(
  db: DrizzleClient,
  demandaId: string,
): Promise<DemandaContagemRecord | null> {
  return loadDemandaWithCounts(db, demandaId);
}

export async function deleteDemandaDb(
  db: DrizzleClient,
  inventarioId: string,
  demandaId: string,
): Promise<void> {
  await db
    .delete(demandasContagem)
    .where(
      and(
        eq(demandasContagem.id, demandaId),
        eq(demandasContagem.inventarioId, inventarioId),
      ),
    );
}

export async function listAllContagemDemandasDb(
  db: DrizzleClient,
): Promise<DemandaContagemRecord[]> {
  const rows = await db
    .select({
      demanda: demandasContagem,
      responsavelNome: users.name,
      totalEnderecos: sql<number>`count(${demandaEnderecos.id})::int`,
      enderecosConferidos: sql<number>`count(*) filter (where ${demandaEnderecos.status} = 'conferido')::int`,
    })
    .from(demandasContagem)
    .innerJoin(users, eq(demandasContagem.responsavelId, users.id))
    .innerJoin(inventarios, eq(demandasContagem.inventarioId, inventarios.id))
    .leftJoin(demandaEnderecos, eq(demandaEnderecos.demandaId, demandasContagem.id))
    .where(
      and(
        eq(demandasContagem.ativo, true),
        notInArray(demandasContagem.status, ['concluida', 'cancelada']),
        notInArray(inventarios.status, ['concluido']),
      ),
    )
    .groupBy(demandasContagem.id, users.name)
    .orderBy(demandasContagem.createdAt);

  return rows.map((row) =>
    mapDemandaRow(
      row.demanda,
      row.responsavelNome,
      row.totalEnderecos,
      row.enderecosConferidos,
    ),
  );
}

export async function listDemandasForOperatorDb(
  db: DrizzleClient,
  operatorId: number,
): Promise<DemandaContagemRecord[]> {
  const rows = await db
    .select({
      demanda: demandasContagem,
      responsavelNome: users.name,
      totalEnderecos: sql<number>`count(${demandaEnderecos.id})::int`,
      enderecosConferidos: sql<number>`count(*) filter (where ${demandaEnderecos.status} = 'conferido')::int`,
    })
    .from(demandasContagem)
    .innerJoin(users, eq(demandasContagem.responsavelId, users.id))
    .innerJoin(inventarios, eq(demandasContagem.inventarioId, inventarios.id))
    .leftJoin(demandaEnderecos, eq(demandaEnderecos.demandaId, demandasContagem.id))
    .where(
      and(
        eq(demandasContagem.responsavelId, operatorId),
        eq(demandasContagem.ativo, true),
        eq(demandasContagem.status, 'em_andamento'),
        eq(inventarios.status, 'em_progresso'),
      ),
    )
    .groupBy(demandasContagem.id, users.name)
    .orderBy(demandasContagem.createdAt);

  return rows.map((row) =>
    mapDemandaRow(
      row.demanda,
      row.responsavelNome,
      row.totalEnderecos,
      row.enderecosConferidos,
    ),
  );
}

export async function listDemandaEnderecosDb(
  db: DrizzleClient,
  demandaId: string,
): Promise<DemandaEnderecoRecord[]> {
  const rows = await db
    .select({
      item: demandaEnderecos,
      enderecoMascarado: enderecos.enderecoMascarado,
      zona: enderecos.zona,
    })
    .from(demandaEnderecos)
    .innerJoin(enderecos, eq(demandaEnderecos.enderecoId, enderecos.id))
    .where(eq(demandaEnderecos.demandaId, demandaId))
    .orderBy(demandaEnderecos.sequence);

  return rows.map((row) =>
    mapDemandaEnderecoRow(
      row.item,
      row.enderecoMascarado,
      row.zona,
    ),
  );
}

export async function findDemandaEnderecoByIdDb(
  db: DrizzleClient,
  demandaId: string,
  itemId: string,
): Promise<DemandaEnderecoRecord | null> {
  const rows = await db
    .select({
      item: demandaEnderecos,
      enderecoMascarado: enderecos.enderecoMascarado,
      zona: enderecos.zona,
    })
    .from(demandaEnderecos)
    .innerJoin(enderecos, eq(demandaEnderecos.enderecoId, enderecos.id))
    .where(
      and(
        eq(demandaEnderecos.id, itemId),
        eq(demandaEnderecos.demandaId, demandaId),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return mapDemandaEnderecoRow(
    row.item,
    row.enderecoMascarado,
    row.zona,
  );
}

export async function markDemandaEnderecoEmAndamentoDb(
  db: DrizzleClient,
  itemId: string,
): Promise<void> {
  await db
    .update(demandaEnderecos)
    .set({
      status: 'em_andamento',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(demandaEnderecos.id, itemId),
        eq(demandaEnderecos.status, 'pendente'),
      ),
    );
}
