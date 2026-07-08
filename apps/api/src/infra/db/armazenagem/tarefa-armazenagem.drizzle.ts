import { and, eq, inArray } from 'drizzle-orm';

import type { TarefaArmazenagemStatus } from '../../../domain/model/armazenagem/armazenagem.model.js';
import type { TarefaArmazenagemRecord } from '../../../domain/repositories/armazenagem/armazenagem.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  enderecos,
  itensArmazenagem,
  produtos,
  tarefasArmazenagem,
  unitizadores,
} from '../providers/drizzle/config/migrations/schema.js';
import {
  mapItemArmazenagemRow,
  mapTarefaArmazenagemRow,
} from './map-armazenagem.drizzle.js';

async function loadItensGroupedByTarefaId(
  db: DrizzleClient,
  tarefaIds: string[],
) {
  const grouped = new Map<string, ReturnType<typeof mapItemArmazenagemRow>[]>();

  for (const id of tarefaIds) {
    grouped.set(id, []);
  }

  if (tarefaIds.length === 0) {
    return grouped;
  }

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
    .where(inArray(itensArmazenagem.tarefaId, tarefaIds));

  for (const row of rows) {
    if (!row.item.tarefaId) {
      continue;
    }

    const current = grouped.get(row.item.tarefaId) ?? [];
    current.push(
      mapItemArmazenagemRow(row.item, {
        produtoSku: row.produtoSku,
        produtoNome: row.produtoNome,
        unitizadorCodigo: row.unitizadorCodigo,
        enderecoSugeridoLabel: row.enderecoSugeridoLabel,
      }),
    );
    grouped.set(row.item.tarefaId, current);
  }

  return grouped;
}

export async function loadTarefasWithItensByDemandaIdDb(
  db: DrizzleClient,
  demandaId: string,
): Promise<TarefaArmazenagemRecord[]> {
  const tarefaRows = await db
    .select({
      tarefa: tarefasArmazenagem,
      unitizadorCodigo: unitizadores.codigo,
      enderecoSugeridoLabel: enderecos.enderecoMascarado,
    })
    .from(tarefasArmazenagem)
    .leftJoin(
      unitizadores,
      eq(tarefasArmazenagem.unitizadorId, unitizadores.id),
    )
    .leftJoin(
      enderecos,
      eq(tarefasArmazenagem.enderecoSugeridoId, enderecos.id),
    )
    .where(eq(tarefasArmazenagem.demandaId, demandaId))
    .orderBy(tarefasArmazenagem.sequencia);

  if (tarefaRows.length === 0) {
    return [];
  }

  const tarefaIds = tarefaRows.map((row) => row.tarefa.id);
  const itensPorTarefa = await loadItensGroupedByTarefaId(db, tarefaIds);

  return tarefaRows.map((row) =>
    mapTarefaArmazenagemRow(row.tarefa, {
      unitizadorCodigo: row.unitizadorCodigo,
      enderecoSugeridoLabel: row.enderecoSugeridoLabel,
      itens: itensPorTarefa.get(row.tarefa.id) ?? [],
    }),
  );
}

export async function findTarefaByIdDb(
  db: DrizzleClient,
  id: string,
): Promise<TarefaArmazenagemRecord | null> {
  const [row] = await db
    .select({
      tarefa: tarefasArmazenagem,
      unitizadorCodigo: unitizadores.codigo,
      enderecoSugeridoLabel: enderecos.enderecoMascarado,
    })
    .from(tarefasArmazenagem)
    .leftJoin(
      unitizadores,
      eq(tarefasArmazenagem.unitizadorId, unitizadores.id),
    )
    .leftJoin(
      enderecos,
      eq(tarefasArmazenagem.enderecoSugeridoId, enderecos.id),
    )
    .where(eq(tarefasArmazenagem.id, id))
    .limit(1);

  if (!row) {
    return null;
  }

  const itensPorTarefa = await loadItensGroupedByTarefaId(db, [id]);

  return mapTarefaArmazenagemRow(row.tarefa, {
    unitizadorCodigo: row.unitizadorCodigo,
    enderecoSugeridoLabel: row.enderecoSugeridoLabel,
    itens: itensPorTarefa.get(id) ?? [],
  });
}

export async function findTarefaByUnitizadorCodigoDb(
  db: DrizzleClient,
  unidadeId: string,
  codigo: string,
): Promise<TarefaArmazenagemRecord | null> {
  const [row] = await db
    .select({ tarefaId: tarefasArmazenagem.id })
    .from(tarefasArmazenagem)
    .innerJoin(
      unitizadores,
      eq(tarefasArmazenagem.unitizadorId, unitizadores.id),
    )
    .where(
      and(
        eq(unitizadores.unidadeId, unidadeId),
        eq(unitizadores.codigo, codigo.trim().toUpperCase()),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  return findTarefaByIdDb(db, row.tarefaId);
}

export async function updateEnderecoSugeridoTarefaArmazenagemDb(
  db: DrizzleClient,
  id: string,
  enderecoSugeridoId: string,
) {
  const [record] = await db
    .update(tarefasArmazenagem)
    .set({
      enderecoSugeridoId,
      updatedAt: new Date(),
    })
    .where(eq(tarefasArmazenagem.id, id))
    .returning();

  if (!record) {
    return null;
  }

  await db
    .update(itensArmazenagem)
    .set({
      enderecoSugeridoId,
      updatedAt: new Date(),
    })
    .where(eq(itensArmazenagem.tarefaId, id));

  return findTarefaByIdDb(db, id);
}

export async function updateStatusTarefaArmazenagemDb(
  db: DrizzleClient,
  id: string,
  status: TarefaArmazenagemStatus,
  extra?: {
    responsavelId?: number;
    startedAt?: Date;
    finishedAt?: Date;
    enderecoConfirmadoId?: string;
  },
) {
  const [record] = await db
    .update(tarefasArmazenagem)
    .set({
      status,
      responsavelId: extra?.responsavelId,
      startedAt: extra?.startedAt,
      finishedAt: extra?.finishedAt,
      enderecoConfirmadoId: extra?.enderecoConfirmadoId,
      updatedAt: new Date(),
    })
    .where(eq(tarefasArmazenagem.id, id))
    .returning();

  if (!record) {
    return null;
  }

  if (extra?.enderecoConfirmadoId) {
    await db
      .update(itensArmazenagem)
      .set({
        enderecoConfirmadoId: extra.enderecoConfirmadoId,
        updatedAt: new Date(),
      })
      .where(eq(itensArmazenagem.tarefaId, id));
  }

  return findTarefaByIdDb(db, id);
}
