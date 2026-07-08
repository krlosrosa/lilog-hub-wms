import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';

import {
  CNC_QUEUE,
  JOB_CRIAR_CNC,
  JOB_REGISTRAR_EVENTO_CNC,
  type CriarCncJobData,
  type RegistrarEventoCncJobData,
} from '../../infra/queues/cnc-queue.js';

@Injectable()
export class CncEventPublisher {
  private readonly logger = new Logger(CncEventPublisher.name);

  constructor(
    @InjectQueue(CNC_QUEUE)
    private readonly cncQueue: Queue,
  ) {}

  async publish(data: CriarCncJobData): Promise<void> {
    try {
      await this.cncQueue.add(JOB_CRIAR_CNC, data, {
        removeOnComplete: true,
        removeOnFail: 100,
      });
    } catch (error) {
      this.logger.error('Failed to publish CRIAR_CNC event', error);
    }
  }

  async publishRegistrarEvento(data: RegistrarEventoCncJobData): Promise<void> {
    try {
      await this.cncQueue.add(JOB_REGISTRAR_EVENTO_CNC, data, {
        removeOnComplete: true,
        removeOnFail: 100,
      });
    } catch (error) {
      this.logger.error('Failed to publish REGISTRAR_EVENTO_CNC event', error);
    }
  }
}
