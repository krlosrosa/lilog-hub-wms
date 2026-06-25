import { Inject, Injectable } from '@nestjs/common';

import type { CreateAuditLogInput } from '../../../domain/model/audit-log/audit-log.model.js';
import {
  AUDIT_LOG_REPOSITORY,
  type IAuditLogRepository,
} from '../../../domain/repositories/audit-log/audit-log.repository.js';

@Injectable()
export class CreateAuditLogUseCase {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  execute(data: CreateAuditLogInput) {
    return this.auditLogRepository.create(data);
  }
}
