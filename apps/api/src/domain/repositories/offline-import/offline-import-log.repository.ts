import type { CreateOfflineImportLogInput } from '../../model/offline-import/offline-import.model.js';

export const OFFLINE_IMPORT_LOG_REPOSITORY = 'IOfflineImportLogRepository';

export type OfflineImportLogRecord = CreateOfflineImportLogInput & {
  id: string;
  appliedAt: Date;
};

export interface IOfflineImportLogRepository {
  findByExportAndEntryKey(
    exportId: string,
    entryKey: string,
  ): Promise<OfflineImportLogRecord | null>;
  create(data: CreateOfflineImportLogInput): Promise<OfflineImportLogRecord>;
}
