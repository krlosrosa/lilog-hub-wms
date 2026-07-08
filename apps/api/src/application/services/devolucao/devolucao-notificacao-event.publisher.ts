import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';

import {
  JOB_NOTIFICAR_ANOMALIA_TRANSPORTADORA,
  NOTIFICACAO_DEVOLUCAO_QUEUE,
  type NotificarAnomaliaJobData,
} from '../../../infra/queues/notificacao-devolucao.queue.js';

@Injectable()
export class DevolucaoNotificacaoEventPublisher {
  private readonly logger = new Logger(DevolucaoNotificacaoEventPublisher.name);

  constructor(
    @InjectQueue(NOTIFICACAO_DEVOLUCAO_QUEUE)
    private readonly notificacaoQueue: Queue,
  ) {}

  async publishNotificarAnomalia(
    data: NotificarAnomaliaJobData,
  ): Promise<void> {
    try {
      await this.notificacaoQueue.add(
        JOB_NOTIFICAR_ANOMALIA_TRANSPORTADORA,
        data,
        {
          jobId: `notificar-anomalia-${data.demandaId}`,
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );
    } catch (error) {
      this.logger.error(
        'Failed to publish NOTIFICAR_ANOMALIA_TRANSPORTADORA event',
        error,
      );
    }
  }
}
