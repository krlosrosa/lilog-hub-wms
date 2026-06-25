import { and, eq, sql } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  docas,
  operacoesDoca,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapDocaRow } from './map-doca.drizzle.js';

export async function findDocaByIdDb(db: DrizzleClient, id: string) {
  const [row] = await db.select().from(docas).where(eq(docas.id, id)).limit(1);

  return row ? mapDocaRow(row) : null;
}

export async function findDocaByUnidadeAndCodigoDb(
  db: DrizzleClient,
  unidadeId: string,
  codigo: string,
) {
  const [row] = await db
    .select()
    .from(docas)
    .where(and(eq(docas.unidadeId, unidadeId), eq(docas.codigo, codigo.trim())))
    .limit(1);

  return row ? mapDocaRow(row) : null;
}

export async function hasDocaOperationalHistoryDb(
  db: DrizzleClient,
  docaId: string,
) {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(operacoesDoca)
    .where(eq(operacoesDoca.docaId, docaId));

  return (result?.count ?? 0) > 0;
}
