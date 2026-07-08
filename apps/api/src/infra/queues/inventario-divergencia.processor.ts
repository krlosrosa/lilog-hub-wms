import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import { AplicarDivergenciaInventarioUseCase } from '../../application/usecases/inventario/divergencia.usecases.js';
import {
  INVENTARIO_DIVERGENCIA_QUEUE,
  JOB_APLICAR_DIVERGENCIA,
  type AplicarDivergenciaJobData,
} from './inventario-divergencia.queue.js';

@Processor(INVENTARIO_DIVERGENCIA_QUEUE)
export class InventarioDivergenciaProcessor extends WorkerHost {
  private readonly logger = new Logger(InventarioDivergenciaProcessor.name);

  constructor(
    private readonly aplicarDivergenciaInventarioUseCase: AplicarDivergenciaInventarioUseCase,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processando job "${job.name}" (id: ${job.id})`);

    switch (job.name) {
      case JOB_APLICAR_DIVERGENCIA:
        await this.handleAplicarDivergencia(job.data as AplicarDivergenciaJobData);
        break;
      default:
        this.logger.warn(`Job desconhecido: ${job.name}`);
    }
  }

  private async handleAplicarDivergencia(
    data: AplicarDivergenciaJobData,
  ): Promise<void> {
    try {
      await this.aplicarDivergenciaInventarioUseCase.execute(data);
    } catch (error) {
      this.logger.error(
        `Erro ao aplicar divergência ${data.divergenciaId}`,
        error,
      );
      throw error;
    }
  }
}
