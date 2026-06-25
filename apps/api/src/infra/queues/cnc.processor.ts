import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import { CriarCncUseCase } from '../../application/usecases/cnc/criar-cnc.usecase.js';
import {
  CNC_QUEUE,
  JOB_CRIAR_CNC,
  type CriarCncJobData,
} from './cnc-queue.js';

@Processor(CNC_QUEUE)
export class CncProcessor extends WorkerHost {
  private readonly logger = new Logger(CncProcessor.name);

  constructor(private readonly criarCncUseCase: CriarCncUseCase) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing job "${job.name}" (id: ${job.id})`);

    switch (job.name) {
      case JOB_CRIAR_CNC:
        await this.handleCriarCnc(job.data as CriarCncJobData);
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
}
