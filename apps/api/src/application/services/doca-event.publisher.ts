import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';

import type { DocaDomainEvent } from '../../domain/model/doca/doca.events.js';
import {
  AUDIT_LOG_QUEUE,
  JOB_REGISTRAR_AUDIT,
  type RegistrarAuditJobData,
} from '../../infra/queues/audit-log.queue.js';

@Injectable()
export class DocaEventPublisher {
  private readonly logger = new Logger(DocaEventPublisher.name);

  constructor(
    @InjectQueue(AUDIT_LOG_QUEUE)
    private readonly auditQueue: Queue,
  ) {}

  async publish(event: DocaDomainEvent): Promise<void> {
    const jobData: RegistrarAuditJobData = {
      userId: event.userId,
      userEmail: null,
      action: event.type,
      resource: 'doca',
      resourceId: event.operacaoId ?? event.docaId,
      httpMethod: 'EVENT',
      httpPath: event.operacaoId
        ? `/docas/operacoes/${event.operacaoId}`
        : `/docas/${event.docaId}`,
      httpStatus: 200,
      payload: {
        docaId: event.docaId,
        unidadeId: event.unidadeId,
        operacaoId: event.operacaoId ?? null,
        motivo: event.motivo ?? null,
      },
      metadata: event.metadata ?? null,
      ipAddress: null,
    };

    try {
      await this.auditQueue.add(JOB_REGISTRAR_AUDIT, jobData, {
        removeOnComplete: true,
        removeOnFail: 100,
      });
    } catch (error) {
      this.logger.error(`Failed to publish doca event ${event.type}`, error);
    }
  }
}
