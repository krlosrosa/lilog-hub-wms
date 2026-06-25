import { desc, eq, and, sql, type SQL } from 'drizzle-orm';

import type { ListAuditLogsFilter } from '../../../domain/repositories/audit-log/audit-log.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { auditLogs } from '../providers/drizzle/config/migrations/schema.js';
import { mapAuditLogRow } from './create-audit-log.drizzle.js';

export async function listAuditLogsDb(
  db: DrizzleClient,
  filter: ListAuditLogsFilter,
) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];

  if (filter.userId) {
    conditions.push(eq(auditLogs.userId, filter.userId));
  }

  if (filter.resource) {
    conditions.push(eq(auditLogs.resource, filter.resource));
  }

  if (filter.action) {
    conditions.push(eq(auditLogs.action, filter.action));
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  const items = await db
    .select()
    .from(auditLogs)
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(auditLogs)
    .where(whereClause);

  const count = countResult[0]?.count ?? 0;

  return {
    items: items.map(mapAuditLogRow),
    total: count,
    page,
    limit,
  };
}
