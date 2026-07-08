import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import { NotificarAnomaliaTransportadoraDevolucaoUseCase } from '../../application/usecases/devolucao/notificar-anomalia-transportadora-devolucao.usecase.js';
import {
  JOB_NOTIFICAR_ANOMALIA_TRANSPORTADORA,
  NOTIFICACAO_DEVOLUCAO_QUEUE,
  type NotificarAnomaliaJobData,
} from './notificacao-devolucao.queue.js';

@Processor(NOTIFICACAO_DEVOLUCAO_QUEUE)
export class NotificacaoDevolucaoProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificacaoDevolucaoProcessor.name);

  constructor(
    private readonly notificarAnomaliaUseCase: NotificarAnomaliaTransportadoraDevolucaoUseCase,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processando job "${job.name}" (id: ${job.id})`);

    switch (job.name) {
      case JOB_NOTIFICAR_ANOMALIA_TRANSPORTADORA:
        await this.handleNotificarAnomalia(job.data as NotificarAnomaliaJobData);
        break;
      default:
        this.logger.warn(`Job desconhecido: ${job.name}`);
    }
  }

  private async handleNotificarAnomalia(
    data: NotificarAnomaliaJobData,
  ): Promise<void> {
    try {
      await this.notificarAnomaliaUseCase.execute(data);
    } catch (error) {
      this.logger.error(
        `Erro ao notificar anomalia da demanda ${data.demandaId}`,
        error,
      );
      throw error;
    }
  }
}
