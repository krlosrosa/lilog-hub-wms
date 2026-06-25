import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';

import {
  EXPEDICAO_TRANSPORTE_QUEUE,
  JOB_RECALCULAR_STATUS,
  JOB_SINCRONIZAR_VIAGEM_RAVEX,
  type RecalcularStatusTransporteJobData,
  type SincronizarViagemRavexJobData,
} from '../../infra/queues/expedicao-transporte.queue.js';

@Injectable()
export class TransporteEventPublisher {
  private readonly logger = new Logger(TransporteEventPublisher.name);

  constructor(
    @InjectQueue(EXPEDICAO_TRANSPORTE_QUEUE)
    private readonly expedicaoTransporteQueue: Queue,
  ) {}

  async publishRecalcularStatus(
    data: RecalcularStatusTransporteJobData,
  ): Promise<void> {
    try {
      await this.expedicaoTransporteQueue.add(JOB_RECALCULAR_STATUS, data, {
        jobId: `recalcular-status-${data.transporteId}`,
        removeOnComplete: true,
        removeOnFail: 100,
      });
    } catch (error) {
      this.logger.error('Failed to publish RECALCULAR_STATUS event', error);
    }
  }

  async publishSincronizarViagemRavex(
    data: SincronizarViagemRavexJobData,
    options?: { delay?: number },
  ): Promise<void> {
    try {
      await this.expedicaoTransporteQueue.add(
        JOB_SINCRONIZAR_VIAGEM_RAVEX,
        data,
        {
          jobId: `viagem-ravex-${data.transporteId}-${data.fase}`,
          delay: options?.delay ?? 0,
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );
    } catch (error) {
      this.logger.error('Failed to publish SINCRONIZAR_VIAGEM_RAVEX event', error);
    }
  }
}
