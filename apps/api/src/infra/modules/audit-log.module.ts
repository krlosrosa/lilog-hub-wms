import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { CreateAuditLogUseCase } from '../../application/usecases/audit-log/create-audit-log.usecase.js';
import { ListAuditLogsUseCase } from '../../application/usecases/audit-log/list-audit-logs.usecase.js';
import { AUDIT_LOG_REPOSITORY } from '../../domain/repositories/audit-log/audit-log.repository.js';
import { AuditLogService } from '../db/audit-log/audit-log.service.js';
import { AuditLogProcessor } from '../queues/audit-log.processor.js';
import { AUDIT_LOG_QUEUE } from '../queues/audit-log.queue.js';
import { ListAuditLogsController } from '../../presentation/controllers/audit-log/list-audit-logs.controller.js';
import { AuditInterceptor } from '../../shared/interceptors/audit.interceptor.js';

@Module({
  imports: [
    BullModule.registerQueue({ name: AUDIT_LOG_QUEUE }),
    BullBoardModule.forFeature({
      name: AUDIT_LOG_QUEUE,
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [ListAuditLogsController],
  providers: [
    CreateAuditLogUseCase,
    ListAuditLogsUseCase,
    AuditLogProcessor,
    AuditInterceptor,
    {
      provide: AUDIT_LOG_REPOSITORY,
      useClass: AuditLogService,
    },
  ],
  exports: [AuditInterceptor, CreateAuditLogUseCase, BullModule],
})
export class AuditLogModule {}
