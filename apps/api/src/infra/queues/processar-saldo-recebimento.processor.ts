import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import { ProcessarSaldoRecebimentoUseCase } from '../../application/usecases/recebimento/processar-saldo-recebimento.usecase.js';
import {
  JOB_PROCESSAR_SALDO_RECEBIMENTO,
  RECEBIMENTO_QUEUE,
  type ProcessarSaldoRecebimentoJobData,
} from './recebimento.queue.js';

@Processor(RECEBIMENTO_QUEUE)
export class ProcessarSaldoRecebimentoProcessor extends WorkerHost {
  private readonly logger = new Logger(ProcessarSaldoRecebimentoProcessor.name);

  constructor(
    private readonly processarSaldoRecebimentoUseCase: ProcessarSaldoRecebimentoUseCase,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processando job "${job.name}" (id: ${job.id})`);

    switch (job.name) {
      case JOB_PROCESSAR_SALDO_RECEBIMENTO:
        await this.handleProcessarSaldo(
          job.data as ProcessarSaldoRecebimentoJobData,
        );
        break;
      default:
        this.logger.warn(`Job desconhecido: ${job.name}`);
    }
  }

  private async handleProcessarSaldo(
    data: ProcessarSaldoRecebimentoJobData,
  ): Promise<void> {
    try {
      await this.processarSaldoRecebimentoUseCase.execute(data);
    } catch (error) {
      this.logger.error(
        `Erro ao processar saldo do recebimento ${data.recebimentoId}`,
        error,
      );
      throw error;
    }
  }
}
