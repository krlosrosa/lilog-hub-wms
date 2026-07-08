import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';

import {
  INVENTARIO_DIVERGENCIA_QUEUE,
  JOB_APLICAR_DIVERGENCIA,
  type AplicarDivergenciaJobData,
} from '../../../infra/queues/inventario-divergencia.queue.js';

@Injectable()
export class InventarioDivergenciaEventPublisher {
  private readonly logger = new Logger(InventarioDivergenciaEventPublisher.name);

  constructor(
    @InjectQueue(INVENTARIO_DIVERGENCIA_QUEUE)
    private readonly inventarioDivergenciaQueue: Queue,
  ) {}

  async publicarAplicarDivergencia(
    divergenciaId: string,
    operatorId: number | null,
  ): Promise<void> {
    const data: AplicarDivergenciaJobData = { divergenciaId, operatorId };

    try {
      await this.inventarioDivergenciaQueue.add(
        JOB_APLICAR_DIVERGENCIA,
        data,
        {
          jobId: divergenciaId,
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish ${JOB_APLICAR_DIVERGENCIA} event`,
        error,
      );
      throw error;
    }
  }
}
