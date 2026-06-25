import type { CreateAuditLogInput } from '../../../domain/model/audit-log/audit-log.model.js';
import type { AuditLogRecord } from '../../../domain/repositories/audit-log/audit-log.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { auditLogs } from '../providers/drizzle/config/migrations/schema.js';

export function mapAuditLogRow(
  row: typeof auditLogs.$inferSelect,
): AuditLogRecord {
  return {
    id: row.id,
    userId: row.userId,
    userEmail: row.userEmail,
    action: row.action,
    resource: row.resource,
    resourceId: row.resourceId,
    httpMethod: row.httpMethod,
    httpPath: row.httpPath,
    httpStatus: row.httpStatus,
    payload: row.payload as Record<string, unknown> | null,
    metadata: row.metadata as Record<string, unknown> | null,
    ipAddress: row.ipAddress,
    createdAt: row.createdAt,
  };
}

export async function createAuditLogDb(
  db: DrizzleClient,
  data: CreateAuditLogInput,
): Promise<AuditLogRecord> {
  const [record] = await db
    .insert(auditLogs)
    .values({
      userId: data.userId,
      userEmail: data.userEmail,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      httpMethod: data.httpMethod,
      httpPath: data.httpPath,
      httpStatus: data.httpStatus,
      payload: data.payload,
      metadata: data.metadata,
      ipAddress: data.ipAddress,
    })
    .returning();

  if (!record) {
    throw new Error('Failed to create audit log');
  }

  return mapAuditLogRow(record);
}
