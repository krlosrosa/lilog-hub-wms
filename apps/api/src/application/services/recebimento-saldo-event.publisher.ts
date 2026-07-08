import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';

import {
  JOB_PROCESSAR_SALDO_RECEBIMENTO,
  RECEBIMENTO_QUEUE,
  type ProcessarSaldoRecebimentoJobData,
} from '../../infra/queues/recebimento.queue.js';

@Injectable()
export class RecebimentoSaldoEventPublisher {
  private readonly logger = new Logger(RecebimentoSaldoEventPublisher.name);

  constructor(
    @InjectQueue(RECEBIMENTO_QUEUE)
    private readonly recebimentoQueue: Queue,
  ) {}

  async publishProcessarSaldo(
    data: ProcessarSaldoRecebimentoJobData,
  ): Promise<void> {
    try {
      await this.recebimentoQueue.add(JOB_PROCESSAR_SALDO_RECEBIMENTO, data, {
        jobId: `processar-saldo-recebimento-${data.recebimentoId}`,
        removeOnComplete: true,
        removeOnFail: 100,
      });
    } catch (error) {
      this.logger.error(
        `Failed to publish ${JOB_PROCESSAR_SALDO_RECEBIMENTO} event`,
        error,
      );
      throw error;
    }
  }
}
