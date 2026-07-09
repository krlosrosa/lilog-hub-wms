import { and, eq } from 'drizzle-orm';

import type { CreateOfflineImportLogInput } from '../../../domain/model/offline-import/offline-import.model.js';
import type { OfflineImportLogRecord } from '../../../domain/repositories/offline-import/offline-import-log.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { offlineImportLogs } from '../providers/drizzle/config/migrations/schema.js';

function mapOfflineImportLogRow(
  row: typeof offlineImportLogs.$inferSelect,
): OfflineImportLogRecord {
  return {
    id: row.id,
    exportId: row.exportId,
    demandId: row.demandId,
    entryKey: row.entryKey,
    endpoint: row.endpoint,
    method: row.method,
    label: row.label,
    status: row.status as OfflineImportLogRecord['status'],
    errorMessage: row.errorMessage ?? undefined,
    userId: row.userId,
    appliedAt: row.appliedAt,
  };
}

export async function findOfflineImportLogByExportAndEntryKeyDb(
  db: DrizzleClient,
  exportId: string,
  entryKey: string,
): Promise<OfflineImportLogRecord | null> {
  const [row] = await db
    .select()
    .from(offlineImportLogs)
    .where(
      and(
        eq(offlineImportLogs.exportId, exportId),
        eq(offlineImportLogs.entryKey, entryKey),
      ),
    )
    .limit(1);

  return row ? mapOfflineImportLogRow(row) : null;
}

export async function createOfflineImportLogDb(
  db: DrizzleClient,
  data: CreateOfflineImportLogInput,
): Promise<OfflineImportLogRecord> {
  const [row] = await db
    .insert(offlineImportLogs)
    .values({
      exportId: data.exportId,
      demandId: data.demandId,
      entryKey: data.entryKey,
      endpoint: data.endpoint,
      method: data.method,
      label: data.label,
      status: data.status,
      errorMessage: data.errorMessage,
      userId: data.userId ?? null,
    })
    .returning();

  if (!row) {
    throw new Error('Failed to create offline import log');
  }

  return mapOfflineImportLogRow(row);
}
