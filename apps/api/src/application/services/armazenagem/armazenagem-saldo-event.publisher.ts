import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';

import {
  ARMAZENAGEM_QUEUE,
  JOB_PROCESSAR_SALDO_ITEM,
  JOB_PROCESSAR_SALDO_TAREFA,
  type ProcessarSaldoItemJobData,
  type ProcessarSaldoTarefaJobData,
} from '../../../infra/queues/armazenagem.queue.js';

@Injectable()
export class ArmazenagemSaldoEventPublisher {
  private readonly logger = new Logger(ArmazenagemSaldoEventPublisher.name);

  constructor(
    @InjectQueue(ARMAZENAGEM_QUEUE)
    private readonly armazenagemQueue: Queue,
  ) {}

  async publishProcessarSaldoItem(
    data: ProcessarSaldoItemJobData,
  ): Promise<void> {
    try {
      await this.armazenagemQueue.add(JOB_PROCESSAR_SALDO_ITEM, data, {
        jobId: `processar-saldo-armazenagem-item-${data.itemId}`,
        removeOnComplete: true,
        removeOnFail: 100,
      });
    } catch (error) {
      this.logger.error(
        `Failed to publish ${JOB_PROCESSAR_SALDO_ITEM} event`,
        error,
      );
      throw error;
    }
  }

  async publishProcessarSaldoTarefa(
    data: ProcessarSaldoTarefaJobData,
  ): Promise<void> {
    try {
      await this.armazenagemQueue.add(JOB_PROCESSAR_SALDO_TAREFA, data, {
        jobId: `processar-saldo-armazenagem-tarefa-${data.tarefaId}`,
        removeOnComplete: true,
        removeOnFail: 100,
      });
    } catch (error) {
      this.logger.error(
        `Failed to publish ${JOB_PROCESSAR_SALDO_TAREFA} event`,
        error,
      );
      throw error;
    }
  }
}
