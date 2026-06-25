import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import { CreateAuditLogUseCase } from '../../application/usecases/audit-log/create-audit-log.usecase.js';
import {
  AUDIT_LOG_QUEUE,
  JOB_REGISTRAR_AUDIT,
  type RegistrarAuditJobData,
} from './audit-log.queue.js';

@Processor(AUDIT_LOG_QUEUE, { concurrency: 5 })
export class AuditLogProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditLogProcessor.name);

  constructor(
    private readonly createAuditLogUseCase: CreateAuditLogUseCase,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing job "${job.name}" (id: ${job.id})`);

    switch (job.name) {
      case JOB_REGISTRAR_AUDIT:
        await this.handleRegistrarAudit(job.data as RegistrarAuditJobData);
        break;
      default:
        this.logger.warn(`Unknown job: ${job.name}`);
    }
  }

  private async handleRegistrarAudit(
    data: RegistrarAuditJobData,
  ): Promise<void> {
    try {
      await this.createAuditLogUseCase.execute(data);
    } catch (error) {
      this.logger.error('Failed to persist audit log', error);
      throw error;
    }
  }
}
