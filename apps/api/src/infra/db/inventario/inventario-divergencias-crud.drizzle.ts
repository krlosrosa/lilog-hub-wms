import { asc, eq, inArray } from 'drizzle-orm';

import type {
  CreateDivergenciaInput,
  DivergenciaInventarioPersistedRecord,
  DivergenciaRecontagemAtualRecord,
  UpdateDivergenciaContagemInput,
  UpdateDivergenciaStatusInput,
} from '../../../domain/repositories/inventario/inventario.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  enderecos,
  inventarioDivergencias,
} from '../providers/drizzle/config/migrations/schema.js';
import {
  findRecontagemAbertaByDivergenciaDb,
  listRecontagensAbertasByDivergenciaIdsDb,
} from './inventario-divergencia-recontagens.drizzle.js';

function mapNumeric(value: string | number): number {
  return typeof value === 'number' ? value : Number(value);
}

function mapDivergenciaRow(
  row: typeof inventarioDivergencias.$inferSelect,
  enderecoMascarado: string,
  zona: string,
  recontagemAtual: DivergenciaRecontagemAtualRecord | null = null,
): DivergenciaInventarioPersistedRecord {
  return {
    id: row.id,
    inventarioId: row.inventarioId,
    contagemId: row.contagemId,
    enderecoId: row.enderecoId,
    enderecoMascarado,
    zona,
    saldoEnderecoId: row.saldoEnderecoId,
    depositoId: row.depositoId,
    produtoId: row.produtoId,
    sku: row.sku,
    produtoNome: row.produtoNome,
    quantidadeEsperada: mapNumeric(row.quantidadeEsperada),
    quantidadeContada: mapNumeric(row.quantidadeContada),
    delta: mapNumeric(row.delta),
    unidadeMedida: row.unidadeMedida,
    lote: row.lote,
    tipo: row.tipo,
    status: row.status,
    aprovadaPor: row.aprovadaPor,
    aprovadaEm: row.aprovadaEm,
    motivoAprovacao: row.motivoAprovacao,
    reprovadaPor: row.reprovadaPor,
    reprovadaEm: row.reprovadaEm,
    motivoReprovacao: row.motivoReprovacao,
    documentoRef: row.documentoRef,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    recontagemAtual,
  };
}

export async function createDivergenciasDb(
  db: DrizzleClient,
  items: CreateDivergenciaInput[],
): Promise<DivergenciaInventarioPersistedRecord[]> {
  if (items.length === 0) {
    return [];
  }

  const rows = await db
    .insert(inventarioDivergencias)
    .values(
      items.map((item) => ({
        inventarioId: item.inventarioId,
        contagemId: item.contagemId,
        enderecoId: item.enderecoId,
        saldoEnderecoId: item.saldoEnderecoId,
        depositoId: item.depositoId,
        produtoId: item.produtoId,
        sku: item.sku,
        produtoNome: item.produtoNome,
        quantidadeEsperada: String(item.quantidadeEsperada),
        quantidadeContada: String(item.quantidadeContada),
        delta: String(item.delta),
        unidadeMedida: item.unidadeMedida,
        lote: item.lote,
        tipo: item.tipo,
        documentoRef: item.documentoRef,
      })),
    )
    .returning();

  const enderecoIds = [...new Set(rows.map((row) => row.enderecoId))];
  const enderecoRows = await db
    .select({
      id: enderecos.id,
      enderecoMascarado: enderecos.enderecoMascarado,
      zona: enderecos.zona,
    })
    .from(enderecos)
    .where(inArray(enderecos.id, enderecoIds));

  const enderecoMap = new Map(
    enderecoRows.map((item) => [
      item.id,
      { enderecoMascarado: item.enderecoMascarado, zona: item.zona },
    ]),
  );

  return rows.map((row) => {
    const endereco = enderecoMap.get(row.enderecoId);
    return mapDivergenciaRow(
      row,
      endereco?.enderecoMascarado ?? '—',
      endereco?.zona ?? '—',
    );
  });
}

export async function listDivergenciasByInventarioDb(
  db: DrizzleClient,
  inventarioId: string,
): Promise<DivergenciaInventarioPersistedRecord[]> {
  const rows = await db
    .select({
      divergencia: inventarioDivergencias,
      enderecoMascarado: enderecos.enderecoMascarado,
      zona: enderecos.zona,
    })
    .from(inventarioDivergencias)
    .innerJoin(enderecos, eq(inventarioDivergencias.enderecoId, enderecos.id))
    .where(eq(inventarioDivergencias.inventarioId, inventarioId))
    .orderBy(asc(inventarioDivergencias.createdAt));

  const divergenciaIds = rows.map((row) => row.divergencia.id);
  const recontagensMap = await listRecontagensAbertasByDivergenciaIdsDb(
    db,
    divergenciaIds,
  );

  return rows.map((row) =>
    mapDivergenciaRow(
      row.divergencia,
      row.enderecoMascarado,
      row.zona,
      recontagensMap.get(row.divergencia.id) ?? null,
    ),
  );
}

export async function findDivergenciaByIdDb(
  db: DrizzleClient,
  id: string,
): Promise<DivergenciaInventarioPersistedRecord | null> {
  const rows = await db
    .select({
      divergencia: inventarioDivergencias,
      enderecoMascarado: enderecos.enderecoMascarado,
      zona: enderecos.zona,
    })
    .from(inventarioDivergencias)
    .innerJoin(enderecos, eq(inventarioDivergencias.enderecoId, enderecos.id))
    .where(eq(inventarioDivergencias.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  const recontagemAtual = await findRecontagemAbertaByDivergenciaDb(
    db,
    row.divergencia.id,
  );

  return mapDivergenciaRow(
    row.divergencia,
    row.enderecoMascarado,
    row.zona,
    recontagemAtual,
  );
}

export async function updateDivergenciaContagemDb(
  db: DrizzleClient,
  id: string,
  data: UpdateDivergenciaContagemInput,
): Promise<DivergenciaInventarioPersistedRecord> {
  const [row] = await db
    .update(inventarioDivergencias)
    .set({
      contagemId: data.contagemId,
      saldoEnderecoId: data.saldoEnderecoId,
      depositoId: data.depositoId,
      produtoId: data.produtoId,
      quantidadeEsperada: String(data.quantidadeEsperada),
      quantidadeContada: String(data.quantidadeContada),
      delta: String(data.delta),
      lote: data.lote,
      tipo: data.tipo,
      documentoRef: data.documentoRef,
      updatedAt: new Date(),
    })
    .where(eq(inventarioDivergencias.id, id))
    .returning();

  if (!row) {
    throw new Error(`Divergência "${id}" não encontrada`);
  }

  const enderecoRows = await db
    .select({
      enderecoMascarado: enderecos.enderecoMascarado,
      zona: enderecos.zona,
    })
    .from(enderecos)
    .where(eq(enderecos.id, row.enderecoId))
    .limit(1);

  const endereco = enderecoRows[0];
  const recontagemAtual = await findRecontagemAbertaByDivergenciaDb(db, id);

  return mapDivergenciaRow(
    row,
    endereco?.enderecoMascarado ?? '—',
    endereco?.zona ?? '—',
    recontagemAtual,
  );
}

export async function updateDivergenciaStatusDb(
  db: DrizzleClient,
  id: string,
  data: UpdateDivergenciaStatusInput,
): Promise<DivergenciaInventarioPersistedRecord> {
  const [row] = await db
    .update(inventarioDivergencias)
    .set({
      status: data.status,
      aprovadaPor: data.aprovadaPor,
      aprovadaEm: data.aprovadaEm,
      motivoAprovacao: data.motivoAprovacao,
      reprovadaPor: data.reprovadaPor,
      reprovadaEm: data.reprovadaEm,
      motivoReprovacao: data.motivoReprovacao,
      updatedAt: new Date(),
    })
    .where(eq(inventarioDivergencias.id, id))
    .returning();

  if (!row) {
    throw new Error(`Divergência "${id}" não encontrada`);
  }

  const enderecoRows = await db
    .select({
      enderecoMascarado: enderecos.enderecoMascarado,
      zona: enderecos.zona,
    })
    .from(enderecos)
    .where(eq(enderecos.id, row.enderecoId))
    .limit(1);

  const endereco = enderecoRows[0];
  const recontagemAtual = await findRecontagemAbertaByDivergenciaDb(db, id);

  return mapDivergenciaRow(
    row,
    endereco?.enderecoMascarado ?? '—',
    endereco?.zona ?? '—',
    recontagemAtual,
  );
}
