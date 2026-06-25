import { Inject, Injectable } from '@nestjs/common';

import {
  AUDIT_LOG_REPOSITORY,
  type IAuditLogRepository,
  type ListAuditLogsFilter,
} from '../../../domain/repositories/audit-log/audit-log.repository.js';

@Injectable()
export class ListAuditLogsUseCase {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  execute(filter: ListAuditLogsFilter) {
    return this.auditLogRepository.list(filter);
  }
}
