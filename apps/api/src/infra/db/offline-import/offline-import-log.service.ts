import { Inject, Injectable } from '@nestjs/common';

import type { CreateOfflineImportLogInput } from '../../../domain/model/offline-import/offline-import.model.js';
import type { IOfflineImportLogRepository } from '../../../domain/repositories/offline-import/offline-import-log.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import {
  createOfflineImportLogDb,
  findOfflineImportLogByExportAndEntryKeyDb,
} from './create-offline-import-log.drizzle.js';

@Injectable()
export class OfflineImportLogService implements IOfflineImportLogRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  findByExportAndEntryKey(exportId: string, entryKey: string) {
    return findOfflineImportLogByExportAndEntryKeyDb(this.db, exportId, entryKey);
  }

  create(data: CreateOfflineImportLogInput) {
    return createOfflineImportLogDb(this.db, data);
  }
}
