import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import { GerarProcessoDebitoDevolucaoUseCase } from '../../application/usecases/cobranca-transportadora/gerar-processo-debito-devolucao.usecase.js';
import {
  COBRANCA_TRANSPORTADORA_QUEUE,
  JOB_GERAR_PROCESSO_DEBITO,
  type GerarProcessoDebitoJobData,
} from './cobranca-transportadora.queue.js';

@Processor(COBRANCA_TRANSPORTADORA_QUEUE)
export class GerarProcessoDebitoProcessor extends WorkerHost {
  private readonly logger = new Logger(GerarProcessoDebitoProcessor.name);

  constructor(
    private readonly gerarProcessoDebitoUseCase: GerarProcessoDebitoDevolucaoUseCase,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processando job "${job.name}" (id: ${job.id})`);

    switch (job.name) {
      case JOB_GERAR_PROCESSO_DEBITO:
        await this.handleGerarProcessoDebito(
          job.data as GerarProcessoDebitoJobData,
        );
        break;
      default:
        this.logger.warn(`Job desconhecido: ${job.name}`);
    }
  }

  private async handleGerarProcessoDebito(
    data: GerarProcessoDebitoJobData,
  ): Promise<void> {
    try {
      await this.gerarProcessoDebitoUseCase.execute(data);
    } catch (error) {
      this.logger.error(
        `Erro ao gerar processo de débito para demanda ${data.demandaId}`,
        error,
      );
      throw error;
    }
  }
}
