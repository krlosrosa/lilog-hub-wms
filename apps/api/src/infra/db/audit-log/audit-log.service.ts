import { Inject, Injectable } from '@nestjs/common';

import type { CreateAuditLogInput } from '../../../domain/model/audit-log/audit-log.model.js';
import {
  AUDIT_LOG_REPOSITORY,
  type IAuditLogRepository,
  type ListAuditLogsFilter,
} from '../../../domain/repositories/audit-log/audit-log.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import {
  createAuditLogDb,
} from './create-audit-log.drizzle.js';
import { listAuditLogsDb } from './list-audit-logs.drizzle.js';

@Injectable()
export class AuditLogService implements IAuditLogRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  create(data: CreateAuditLogInput) {
    return createAuditLogDb(this.db, data);
  }

  list(filter: ListAuditLogsFilter) {
    return listAuditLogsDb(this.db, filter);
  }
}