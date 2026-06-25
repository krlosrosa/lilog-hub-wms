import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';

import type { RecebimentoDomainEvent } from '../../domain/model/recebimento/recebimento.events.js';
import {
  AUDIT_LOG_QUEUE,
  JOB_REGISTRAR_AUDIT,
  type RegistrarAuditJobData,
} from '../../infra/queues/audit-log.queue.js';

@Injectable()
export class RecebimentoEventPublisher {
  private readonly logger = new Logger(RecebimentoEventPublisher.name);

  constructor(
    @InjectQueue(AUDIT_LOG_QUEUE)
    private readonly auditQueue: Queue,
  ) {}

  async publish(event: RecebimentoDomainEvent): Promise<void> {
    const jobData: RegistrarAuditJobData = {
      userId: event.userId,
      userEmail: null,
      action: event.type,
      resource: 'recebimento',
      resourceId: event.recebimentoId ?? event.preRecebimentoId,
      httpMethod: 'EVENT',
      httpPath: event.recebimentoId
        ? `/recebimentos/${event.recebimentoId}`
        : `/pre-recebimentos/${event.preRecebimentoId}`,
      httpStatus: 200,
      payload: {
        preRecebimentoId: event.preRecebimentoId,
        recebimentoId: event.recebimentoId ?? null,
        unidadeId: event.unidadeId,
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
      this.logger.error(
        `Failed to publish recebimento event ${event.type}`,
        error,
      );
    }
  }
}
