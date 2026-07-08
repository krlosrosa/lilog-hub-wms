import { and, desc, eq, gte, lt } from 'drizzle-orm';

import type { CncOrigem } from '../../../domain/model/cnc/cnc.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  cncEventos,
  cncItens,
  cncTratativas,
  naoConformidades,
} from '../providers/drizzle/config/migrations/schema.js';
import {
  mapCncEventoRow,
  mapCncItemRow,
  mapCncRow,
  mapCncTratativaRow,
} from './map-cnc.drizzle.js';

async function loadCncItens(db: DrizzleClient, cncId: string) {
  const rows = await db
    .select()
    .from(cncItens)
    .where(eq(cncItens.cncId, cncId));

  return rows.map(mapCncItemRow);
}

async function loadCncTratativas(db: DrizzleClient, cncId: string) {
  const rows = await db
    .select()
    .from(cncTratativas)
    .where(eq(cncTratativas.cncId, cncId))
    .orderBy(desc(cncTratativas.createdAt));

  return rows.map(mapCncTratativaRow);
}

async function loadCncEventos(db: DrizzleClient, cncId: string) {
  const rows = await db
    .select()
    .from(cncEventos)
    .where(eq(cncEventos.cncId, cncId))
    .orderBy(desc(cncEventos.createdAt));

  return rows.map(mapCncEventoRow);
}

export async function findCncByIdDb(db: DrizzleClient, id: string) {
  const [row] = await db
    .select()
    .from(naoConformidades)
    .where(eq(naoConformidades.id, id))
    .limit(1);

  if (!row) {
    return null;
  }

  const [itens, tratativas, eventos] = await Promise.all([
    loadCncItens(db, row.id),
    loadCncTratativas(db, row.id),
    loadCncEventos(db, row.id),
  ]);

  return {
    ...mapCncRow(row),
    itens,
    tratativas,
    eventos,
  };
}

export async function findCncByOrigemDb(
  db: DrizzleClient,
  origem: CncOrigem,
  origemId: string,
) {
  const [row] = await db
    .select()
    .from(naoConformidades)
    .where(
      and(
        eq(naoConformidades.origem, origem),
        eq(naoConformidades.origemId, origemId),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const itens = await loadCncItens(db, row.id);

  return {
    ...mapCncRow(row),
    itens,
  };
}

export async function countCncByYearDb(db: DrizzleClient, year: number) {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  const rows = await db
    .select()
    .from(naoConformidades)
    .where(
      and(
        gte(naoConformidades.createdAt, start),
        lt(naoConformidades.createdAt, end),
      ),
    );

  return rows.length;
}
