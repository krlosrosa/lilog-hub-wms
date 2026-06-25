import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';

import {
  CNC_QUEUE,
  JOB_CRIAR_CNC,
  type CriarCncJobData,
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
}
