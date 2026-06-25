import { and, eq, gte, lt } from 'drizzle-orm';

import type { CncOrigem } from '../../../domain/model/cnc/cnc.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  cncItens,
  naoConformidades,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapCncItemRow, mapCncRow } from './map-cnc.drizzle.js';

async function loadCncItens(db: DrizzleClient, cncId: string) {
  const rows = await db
    .select()
    .from(cncItens)
    .where(eq(cncItens.cncId, cncId));

  return rows.map(mapCncItemRow);
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

  const itens = await loadCncItens(db, row.id);

  return {
    ...mapCncRow(row),
    itens,
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
