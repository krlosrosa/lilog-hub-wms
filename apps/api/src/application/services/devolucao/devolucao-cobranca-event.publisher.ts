import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';

import {
  COBRANCA_TRANSPORTADORA_QUEUE,
  JOB_GERAR_PROCESSO_DEBITO,
  type GerarProcessoDebitoJobData,
} from '../../../infra/queues/cobranca-transportadora.queue.js';

@Injectable()
export class DevolucaoCobrancaEventPublisher {
  private readonly logger = new Logger(DevolucaoCobrancaEventPublisher.name);

  constructor(
    @InjectQueue(COBRANCA_TRANSPORTADORA_QUEUE)
    private readonly cobrancaQueue: Queue,
  ) {}

  async publishGerarProcessoDebito(
    data: GerarProcessoDebitoJobData,
  ): Promise<void> {
    try {
      await this.cobrancaQueue.add(JOB_GERAR_PROCESSO_DEBITO, data, {
        jobId: `gerar-processo-debito-${data.demandaId}`,
        removeOnComplete: true,
        removeOnFail: 100,
      });
    } catch (error) {
      this.logger.error('Failed to publish GERAR_PROCESSO_DEBITO event', error);
    }
  }
}
