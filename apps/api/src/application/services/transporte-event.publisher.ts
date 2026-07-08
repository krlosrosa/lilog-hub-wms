import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';

import {
  EXPEDICAO_TRANSPORTE_QUEUE,
  JOB_RECALCULAR_STATUS,
  JOB_SINCRONIZAR_VIAGEM_RAVEX,
  type RecalcularStatusTransporteJobData,
  type SincronizarViagemRavexJobData,
} from '../../infra/queues/expedicao-transporte.queue.js';

@Injectable()
export class TransporteEventPublisher {
  private readonly logger = new Logger(TransporteEventPublisher.name);

  constructor(
    @InjectQueue(EXPEDICAO_TRANSPORTE_QUEUE)
    private readonly expedicaoTransporteQueue: Queue,
  ) {}

  async publishRecalcularStatus(
    data: RecalcularStatusTransporteJobData,
  ): Promise<void> {
    try {
      await this.expedicaoTransporteQueue.add(JOB_RECALCULAR_STATUS, data, {
        jobId: `recalcular-status-${data.transporteId}`,
        removeOnComplete: true,
        removeOnFail: 100,
      });
    } catch (error) {
      this.logger.error('Failed to publish RECALCULAR_STATUS event', error);
    }
  }

  async publishSincronizarViagemRavex(
    data: SincronizarViagemRavexJobData,
    options?: { delay?: number },
  ): Promise<void> {
    const jobId = `viagem-ravex-${data.transporteId}-${data.fase}`;
    const delay = options?.delay ?? 0;

    try {
      const existing = await this.expedicaoTransporteQueue.getJob(jobId);

      if (existing) {
        const state = await existing.getState();

        if (state === 'failed' || state === 'completed') {
          await existing.remove();
        } else if (state === 'active') {
          if (delay > 0) {
            await this.enqueueNextPollingCycle(jobId, data, delay);
          }
          return;
        } else if (
          state === 'waiting' ||
          state === 'delayed' ||
          state === 'prioritized'
        ) {
          this.logger.debug(
            `Job "${jobId}" já está ${state}; sync Ravex não reenfileirado`,
          );
          return;
        }
      }

      await this.expedicaoTransporteQueue.add(
        JOB_SINCRONIZAR_VIAGEM_RAVEX,
        data,
        {
          jobId,
          delay,
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );
    } catch (error) {
      this.logger.error('Failed to publish SINCRONIZAR_VIAGEM_RAVEX event', error);
    }
  }

  private async enqueueNextPollingCycle(
    jobId: string,
    data: SincronizarViagemRavexJobData,
    delay: number,
  ): Promise<void> {
    const nextJobId = `${jobId}-next`;
    const existingNext = await this.expedicaoTransporteQueue.getJob(nextJobId);

    if (existingNext) {
      const nextState = await existingNext.getState();

      if (
        nextState === 'waiting' ||
        nextState === 'delayed' ||
        nextState === 'active' ||
        nextState === 'prioritized'
      ) {
        this.logger.debug(
          `Job "${nextJobId}" já está ${nextState}; sync Ravex não reenfileirado`,
        );
        return;
      }

      await existingNext.remove();
    }

    await this.expedicaoTransporteQueue.add(
      JOB_SINCRONIZAR_VIAGEM_RAVEX,
      data,
      {
        jobId: nextJobId,
        delay,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }
}
