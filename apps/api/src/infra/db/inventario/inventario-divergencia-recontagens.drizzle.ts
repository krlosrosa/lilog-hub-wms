import { and, desc, eq, inArray, sql } from 'drizzle-orm';

import type {
  CreateDivergenciaRecontagemInput,
  DivergenciaRecontagemAtualRecord,
  InventarioDivergenciaRecontagemRecord,
  RecontagemContagemPendenteRecord,
} from '../../../domain/repositories/inventario/inventario.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  contagens,
  demandaEnderecos,
  demandasContagem,
  enderecos,
  inventarioDivergenciaRecontagens,
  inventarioDivergencias,
  users,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapContagemRow } from './map-inventario.drizzle.js';

const OPEN_DEMANDA_STATUSES = ['aguardando_inicio', 'em_andamento'] as const;

function mapRecontagemAtualRow(
  row: typeof inventarioDivergenciaRecontagens.$inferSelect,
  demandaStatus: (typeof OPEN_DEMANDA_STATUSES)[number] | string,
  responsavelNome: string,
): DivergenciaRecontagemAtualRecord {
  return {
    id: row.id,
    demandaId: row.demandaId,
    demandaStatus: demandaStatus as DivergenciaRecontagemAtualRecord['demandaStatus'],
    responsavelId: row.responsavelId,
    responsavelNome,
    solicitadaPor: row.solicitadaPor,
    solicitadaEm: row.createdAt,
    motivo: row.motivo,
  };
}

function mapRecontagemRecord(
  row: typeof inventarioDivergenciaRecontagens.$inferSelect,
): InventarioDivergenciaRecontagemRecord {
  return {
    id: row.id,
    inventarioId: row.inventarioId,
    divergenciaId: row.divergenciaId,
    demandaId: row.demandaId,
    solicitadaPor: row.solicitadaPor,
    responsavelId: row.responsavelId,
    motivo: row.motivo,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function findRecontagemAbertaByDivergenciaDb(
  db: DrizzleClient,
  divergenciaId: string,
): Promise<DivergenciaRecontagemAtualRecord | null> {
  const rows = await db
    .select({
      recontagem: inventarioDivergenciaRecontagens,
      demandaStatus: demandasContagem.status,
      responsavelNome: users.name,
    })
    .from(inventarioDivergenciaRecontagens)
    .innerJoin(
      demandasContagem,
      eq(inventarioDivergenciaRecontagens.demandaId, demandasContagem.id),
    )
    .innerJoin(
      users,
      eq(inventarioDivergenciaRecontagens.responsavelId, users.id),
    )
    .where(
      and(
        eq(inventarioDivergenciaRecontagens.divergenciaId, divergenciaId),
        inArray(demandasContagem.status, [...OPEN_DEMANDA_STATUSES]),
      ),
    )
    .orderBy(desc(inventarioDivergenciaRecontagens.createdAt))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return mapRecontagemAtualRow(
    row.recontagem,
    row.demandaStatus,
    row.responsavelNome,
  );
}

export async function listRecontagensAbertasByDivergenciaIdsDb(
  db: DrizzleClient,
  divergenciaIds: string[],
): Promise<Map<string, DivergenciaRecontagemAtualRecord>> {
  if (divergenciaIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({
      recontagem: inventarioDivergenciaRecontagens,
      demandaStatus: demandasContagem.status,
      responsavelNome: users.name,
    })
    .from(inventarioDivergenciaRecontagens)
    .innerJoin(
      demandasContagem,
      eq(inventarioDivergenciaRecontagens.demandaId, demandasContagem.id),
    )
    .innerJoin(
      users,
      eq(inventarioDivergenciaRecontagens.responsavelId, users.id),
    )
    .where(
      and(
        inArray(inventarioDivergenciaRecontagens.divergenciaId, divergenciaIds),
        inArray(demandasContagem.status, [...OPEN_DEMANDA_STATUSES]),
      ),
    )
    .orderBy(desc(inventarioDivergenciaRecontagens.createdAt));

  const map = new Map<string, DivergenciaRecontagemAtualRecord>();
  for (const row of rows) {
    if (map.has(row.recontagem.divergenciaId)) {
      continue;
    }

    map.set(
      row.recontagem.divergenciaId,
      mapRecontagemAtualRow(
        row.recontagem,
        row.demandaStatus,
        row.responsavelNome,
      ),
    );
  }

  return map;
}

export async function findRecontagemAbertaByDemandaDb(
  db: DrizzleClient,
  demandaId: string,
): Promise<InventarioDivergenciaRecontagemRecord | null> {
  const rows = await db
    .select({
      recontagem: inventarioDivergenciaRecontagens,
      demandaStatus: demandasContagem.status,
    })
    .from(inventarioDivergenciaRecontagens)
    .innerJoin(
      demandasContagem,
      eq(inventarioDivergenciaRecontagens.demandaId, demandasContagem.id),
    )
    .where(
      and(
        eq(inventarioDivergenciaRecontagens.demandaId, demandaId),
        inArray(demandasContagem.status, [...OPEN_DEMANDA_STATUSES]),
      ),
    )
    .orderBy(desc(inventarioDivergenciaRecontagens.createdAt))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return mapRecontagemRecord(row.recontagem);
}

export async function listRecontagensComContagemPendenteReconciliacaoDb(
  db: DrizzleClient,
  inventarioId: string,
): Promise<RecontagemContagemPendenteRecord[]> {
  const rows = await db
    .select({
      divergenciaId: inventarioDivergencias.id,
      demandaId: demandasContagem.id,
      enderecoId: demandaEnderecos.enderecoId,
      unidadeId: enderecos.unidadeId,
      contagem: contagens,
      divergenciaContagemId: inventarioDivergencias.contagemId,
      enderecosPendentes: sql<number>`(
        select count(*)::int
        from ${demandaEnderecos} de2
        where de2.demanda_id = ${demandasContagem.id}
          and de2.status <> 'conferido'
      )`,
    })
    .from(inventarioDivergenciaRecontagens)
    .innerJoin(
      inventarioDivergencias,
      eq(inventarioDivergenciaRecontagens.divergenciaId, inventarioDivergencias.id),
    )
    .innerJoin(
      demandasContagem,
      eq(inventarioDivergenciaRecontagens.demandaId, demandasContagem.id),
    )
    .innerJoin(
      demandaEnderecos,
      eq(demandaEnderecos.demandaId, demandasContagem.id),
    )
    .innerJoin(contagens, eq(contagens.demandaEnderecoId, demandaEnderecos.id))
    .innerJoin(enderecos, eq(demandaEnderecos.enderecoId, enderecos.id))
    .where(
      and(
        eq(inventarioDivergencias.inventarioId, inventarioId),
        eq(inventarioDivergencias.status, 'pendente'),
        eq(demandaEnderecos.status, 'conferido'),
      ),
    )
    .orderBy(desc(contagens.createdAt));

  const map = new Map<string, RecontagemContagemPendenteRecord>();

  for (const row of rows) {
    if (row.enderecosPendentes > 0) {
      continue;
    }

    if (row.divergenciaContagemId === row.contagem.id) {
      continue;
    }

    if (map.has(row.divergenciaId)) {
      continue;
    }

    map.set(row.divergenciaId, {
      divergenciaId: row.divergenciaId,
      demandaId: row.demandaId,
      enderecoId: row.enderecoId,
      unidadeId: row.unidadeId,
      contagem: mapContagemRow(row.contagem),
    });
  }

  return [...map.values()];
}

export async function createDivergenciaRecontagemDb(
  db: DrizzleClient,
  input: CreateDivergenciaRecontagemInput,
): Promise<InventarioDivergenciaRecontagemRecord> {
  const [row] = await db
    .insert(inventarioDivergenciaRecontagens)
    .values({
      inventarioId: input.inventarioId,
      divergenciaId: input.divergenciaId,
      demandaId: input.demandaId,
      solicitadaPor: input.solicitadaPor,
      responsavelId: input.responsavelId,
      motivo: input.motivo,
    })
    .returning();

  if (!row) {
    throw new Error('Failed to create divergencia recontagem');
  }

  return mapRecontagemRecord(row);
}
