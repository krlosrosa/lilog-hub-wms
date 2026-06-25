import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';

import type { EnderecoDomainEvent } from '../../domain/model/endereco/endereco.events.js';
import {
  AUDIT_LOG_QUEUE,
  JOB_REGISTRAR_AUDIT,
  type RegistrarAuditJobData,
} from '../../infra/queues/audit-log.queue.js';

@Injectable()
export class EnderecoEventPublisher {
  private readonly logger = new Logger(EnderecoEventPublisher.name);

  constructor(
    @InjectQueue(AUDIT_LOG_QUEUE)
    private readonly auditQueue: Queue,
  ) {}

  async publish(event: EnderecoDomainEvent): Promise<void> {
    const jobData: RegistrarAuditJobData = {
      userId: event.userId,
      userEmail: null,
      action: event.type,
      resource: 'endereco',
      resourceId: event.enderecoId,
      httpMethod: 'EVENT',
      httpPath: `/enderecos/${event.enderecoId}`,
      httpStatus: 200,
      payload: {
        centroId: event.centroId,
        enderecoMascarado: event.enderecoMascarado,
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
      this.logger.error(`Failed to publish endereco event ${event.type}`, error);
    }
  }
}
