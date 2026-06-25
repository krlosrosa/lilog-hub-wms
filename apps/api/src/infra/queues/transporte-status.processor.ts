import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import { RecalcularStatusTransporteUseCase } from '../../application/usecases/expedicao/recalcular-status-transporte.usecase.js';
import { SincronizarViagemRavexUseCase } from '../../application/usecases/expedicao/sincronizar-viagem-ravex.usecase.js';
import {
  EXPEDICAO_TRANSPORTE_QUEUE,
  JOB_RECALCULAR_STATUS,
  JOB_SINCRONIZAR_VIAGEM_RAVEX,
  type RecalcularStatusTransporteJobData,
  type SincronizarViagemRavexJobData,
} from './expedicao-transporte.queue.js';

@Processor(EXPEDICAO_TRANSPORTE_QUEUE)
export class TransporteStatusProcessor extends WorkerHost {
  private readonly logger = new Logger(TransporteStatusProcessor.name);

  constructor(
    private readonly recalcularStatusTransporteUseCase: RecalcularStatusTransporteUseCase,
    private readonly sincronizarViagemRavexUseCase: SincronizarViagemRavexUseCase,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing job "${job.name}" (id: ${job.id})`);

    switch (job.name) {
      case JOB_RECALCULAR_STATUS:
        await this.handleRecalcularStatus(
          job.data as RecalcularStatusTransporteJobData,
        );
        break;
      case JOB_SINCRONIZAR_VIAGEM_RAVEX:
        await this.handleSincronizarViagemRavex(
          job.data as SincronizarViagemRavexJobData,
        );
        break;
      default:
        this.logger.warn(`Unknown job: ${job.name}`);
    }
  }

  private async handleRecalcularStatus(
    data: RecalcularStatusTransporteJobData,
  ): Promise<void> {
    try {
      await this.recalcularStatusTransporteUseCase.execute(data);
    } catch (error) {
      this.logger.error('Failed to recalculate transport status from event', error);
      throw error;
    }
  }

  private async handleSincronizarViagemRavex(
    data: SincronizarViagemRavexJobData,
  ): Promise<void> {
    try {
      await this.sincronizarViagemRavexUseCase.execute(data);
    } catch (error) {
      this.logger.error('Failed to sync Ravex trip for transport', error);
      throw error;
    }
  }
}
