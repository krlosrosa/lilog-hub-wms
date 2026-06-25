import { and, desc, eq, sql, type SQL } from 'drizzle-orm';

import type { ListDocumentosFilter } from '../../../domain/repositories/documento/documento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { documentos } from '../providers/drizzle/config/migrations/schema.js';
import { mapDocumentoRow } from './map-documento.drizzle.js';

export async function listDocumentosDb(
  db: DrizzleClient,
  filter: ListDocumentosFilter,
) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];

  if (filter.entidadeTipo) {
    conditions.push(eq(documentos.entidadeTipo, filter.entidadeTipo));
  }

  if (filter.entidadeId) {
    conditions.push(eq(documentos.entidadeId, filter.entidadeId));
  }

  if (filter.status) {
    conditions.push(eq(documentos.status, filter.status));
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(documentos)
    .where(whereClause)
    .orderBy(desc(documentos.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(documentos)
    .where(whereClause);

  return {
    items: rows.map(mapDocumentoRow),
    total: countResult?.total ?? 0,
    page,
    limit,
  };
}
