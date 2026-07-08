import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import { CriarCncUseCase } from '../../application/usecases/cnc/criar-cnc.usecase.js';
import { RegistrarEventoCncUseCase } from '../../application/usecases/cnc/registrar-evento-cnc.usecase.js';
import {
  CNC_QUEUE,
  JOB_CRIAR_CNC,
  JOB_REGISTRAR_EVENTO_CNC,
  type CriarCncJobData,
  type RegistrarEventoCncJobData,
} from './cnc-queue.js';

@Processor(CNC_QUEUE)
export class CncProcessor extends WorkerHost {
  private readonly logger = new Logger(CncProcessor.name);

  constructor(
    private readonly criarCncUseCase: CriarCncUseCase,
    private readonly registrarEventoCncUseCase: RegistrarEventoCncUseCase,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing job "${job.name}" (id: ${job.id})`);

    switch (job.name) {
      case JOB_CRIAR_CNC:
        await this.handleCriarCnc(job.data as CriarCncJobData);
        break;
      case JOB_REGISTRAR_EVENTO_CNC:
        await this.handleRegistrarEvento(job.data as RegistrarEventoCncJobData);
        break;
      default:
        this.logger.warn(`Unknown job: ${job.name}`);
    }
  }

  private async handleCriarCnc(data: CriarCncJobData): Promise<void> {
    try {
      await this.criarCncUseCase.execute(data);
    } catch (error) {
      this.logger.error('Failed to create CNC from event', error);
      throw error;
    }
  }

  private async handleRegistrarEvento(
    data: RegistrarEventoCncJobData,
  ): Promise<void> {
    try {
      await this.registrarEventoCncUseCase.execute(data);
    } catch (error) {
      this.logger.error('Failed to register CNC event', error);
      throw error;
    }
  }
}
