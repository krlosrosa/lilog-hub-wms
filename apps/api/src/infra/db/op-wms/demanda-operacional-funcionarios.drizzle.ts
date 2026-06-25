import { and, eq, inArray, isNull } from 'drizzle-orm';

import type { DemandaFuncionarioRecord } from '../../../domain/repositories/op-wms/demanda-separacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandaOperacionalFuncionarios,
  sessaoFuncionarios,
} from '../providers/drizzle/config/migrations/schema.js';

function mapDemandaFuncionario(row: {
  id: string;
  demandaId: string;
  sessaoFuncionarioId: string;
  funcionarioId: number;
  papel: DemandaFuncionarioRecord['papel'];
  entrouEm: Date;
  saiuEm: Date | null;
}): DemandaFuncionarioRecord {
  return {
    id: row.id,
    demandaId: row.demandaId,
    sessaoFuncionarioId: row.sessaoFuncionarioId,
    funcionarioId: row.funcionarioId,
    papel: row.papel,
    entrouEm: row.entrouEm,
    saiuEm: row.saiuEm,
  };
}

export async function insertDemandaFuncionarioDb(
  db: DrizzleClient,
  input: {
    demandaId: string;
    sessaoFuncionarioId: string;
    papel: DemandaFuncionarioRecord['papel'];
  },
): Promise<DemandaFuncionarioRecord> {
  const [inserted] = await db
    .insert(demandaOperacionalFuncionarios)
    .values({
      demandaId: input.demandaId,
      sessaoFuncionarioId: input.sessaoFuncionarioId,
      papel: input.papel,
    })
    .returning({
      id: demandaOperacionalFuncionarios.id,
      demandaId: demandaOperacionalFuncionarios.demandaId,
      sessaoFuncionarioId: demandaOperacionalFuncionarios.sessaoFuncionarioId,
      papel: demandaOperacionalFuncionarios.papel,
      entrouEm: demandaOperacionalFuncionarios.entrouEm,
      saiuEm: demandaOperacionalFuncionarios.saiuEm,
    });

  const rows = await db
    .select({
      id: demandaOperacionalFuncionarios.id,
      demandaId: demandaOperacionalFuncionarios.demandaId,
      sessaoFuncionarioId: demandaOperacionalFuncionarios.sessaoFuncionarioId,
      funcionarioId: sessaoFuncionarios.funcionarioId,
      papel: demandaOperacionalFuncionarios.papel,
      entrouEm: demandaOperacionalFuncionarios.entrouEm,
      saiuEm: demandaOperacionalFuncionarios.saiuEm,
    })
    .from(demandaOperacionalFuncionarios)
    .innerJoin(
      sessaoFuncionarios,
      eq(
        demandaOperacionalFuncionarios.sessaoFuncionarioId,
        sessaoFuncionarios.id,
      ),
    )
    .where(eq(demandaOperacionalFuncionarios.id, inserted!.id))
    .limit(1);

  const row = rows[0];
  if (!row) {
    throw new Error('Falha ao inserir funcionário na demanda');
  }

  return mapDemandaFuncionario(row);
}

export async function deleteDemandaFuncionarioDb(
  db: DrizzleClient,
  demandaId: string,
  sessaoFuncionarioId: string,
): Promise<void> {
  await db
    .delete(demandaOperacionalFuncionarios)
    .where(
      and(
        eq(demandaOperacionalFuncionarios.demandaId, demandaId),
        eq(
          demandaOperacionalFuncionarios.sessaoFuncionarioId,
          sessaoFuncionarioId,
        ),
        isNull(demandaOperacionalFuncionarios.saiuEm),
      ),
    );
}

export async function listDemandaFuncionariosDb(
  db: DrizzleClient,
  demandaId: string,
): Promise<DemandaFuncionarioRecord[]> {
  const rows = await db
    .select({
      id: demandaOperacionalFuncionarios.id,
      demandaId: demandaOperacionalFuncionarios.demandaId,
      sessaoFuncionarioId: demandaOperacionalFuncionarios.sessaoFuncionarioId,
      funcionarioId: sessaoFuncionarios.funcionarioId,
      papel: demandaOperacionalFuncionarios.papel,
      entrouEm: demandaOperacionalFuncionarios.entrouEm,
      saiuEm: demandaOperacionalFuncionarios.saiuEm,
    })
    .from(demandaOperacionalFuncionarios)
    .innerJoin(
      sessaoFuncionarios,
      eq(
        demandaOperacionalFuncionarios.sessaoFuncionarioId,
        sessaoFuncionarios.id,
      ),
    )
    .where(
      and(
        eq(demandaOperacionalFuncionarios.demandaId, demandaId),
        isNull(demandaOperacionalFuncionarios.saiuEm),
      ),
    )
    .orderBy(demandaOperacionalFuncionarios.entrouEm);

  return rows.map(mapDemandaFuncionario);
}

export async function listDemandaFuncionariosByDemandaIdsDb(
  db: DrizzleClient,
  demandaIds: string[],
): Promise<DemandaFuncionarioRecord[]> {
  if (demandaIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: demandaOperacionalFuncionarios.id,
      demandaId: demandaOperacionalFuncionarios.demandaId,
      sessaoFuncionarioId: demandaOperacionalFuncionarios.sessaoFuncionarioId,
      funcionarioId: sessaoFuncionarios.funcionarioId,
      papel: demandaOperacionalFuncionarios.papel,
      entrouEm: demandaOperacionalFuncionarios.entrouEm,
      saiuEm: demandaOperacionalFuncionarios.saiuEm,
    })
    .from(demandaOperacionalFuncionarios)
    .innerJoin(
      sessaoFuncionarios,
      eq(
        demandaOperacionalFuncionarios.sessaoFuncionarioId,
        sessaoFuncionarios.id,
      ),
    )
    .where(
      and(
        inArray(demandaOperacionalFuncionarios.demandaId, demandaIds),
        isNull(demandaOperacionalFuncionarios.saiuEm),
      ),
    )
    .orderBy(demandaOperacionalFuncionarios.entrouEm);

  return rows.map(mapDemandaFuncionario);
}

export async function countDemandaFuncionariosAtivosDb(
  db: DrizzleClient,
  demandaId: string,
): Promise<number> {
  const rows = await db
    .select({ id: demandaOperacionalFuncionarios.id })
    .from(demandaOperacionalFuncionarios)
    .where(
      and(
        eq(demandaOperacionalFuncionarios.demandaId, demandaId),
        isNull(demandaOperacionalFuncionarios.saiuEm),
      ),
    );

  return rows.length;
}
