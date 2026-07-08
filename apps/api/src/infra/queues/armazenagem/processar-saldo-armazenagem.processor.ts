import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import { ProcessarSaldoItemArmazenagemUseCase } from '../../../application/usecases/armazenagem/processar-saldo-item-armazenagem.usecase.js';
import { ProcessarSaldoTarefaArmazenagemUseCase } from '../../../application/usecases/armazenagem/processar-saldo-tarefa-armazenagem.usecase.js';
import {
  ARMAZENAGEM_QUEUE,
  JOB_PROCESSAR_SALDO_ITEM,
  JOB_PROCESSAR_SALDO_TAREFA,
  type ProcessarSaldoItemJobData,
  type ProcessarSaldoTarefaJobData,
} from '../armazenagem.queue.js';

@Processor(ARMAZENAGEM_QUEUE)
export class ProcessarSaldoArmazenagemProcessor extends WorkerHost {
  private readonly logger = new Logger(ProcessarSaldoArmazenagemProcessor.name);

  constructor(
    private readonly processarSaldoItemArmazenagemUseCase: ProcessarSaldoItemArmazenagemUseCase,
    private readonly processarSaldoTarefaArmazenagemUseCase: ProcessarSaldoTarefaArmazenagemUseCase,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processando job "${job.name}" (id: ${job.id})`);

    switch (job.name) {
      case JOB_PROCESSAR_SALDO_ITEM:
        await this.handleProcessarSaldoItem(job.data as ProcessarSaldoItemJobData);
        break;
      case JOB_PROCESSAR_SALDO_TAREFA:
        await this.handleProcessarSaldoTarefa(
          job.data as ProcessarSaldoTarefaJobData,
        );
        break;
      default:
        this.logger.warn(`Job desconhecido: ${job.name}`);
    }
  }

  private async handleProcessarSaldoItem(
    data: ProcessarSaldoItemJobData,
  ): Promise<void> {
    try {
      await this.processarSaldoItemArmazenagemUseCase.execute(data);
    } catch (error) {
      this.logger.error(
        `Erro ao processar saldo do item ${data.itemId} da armazenagem`,
        error,
      );
      throw error;
    }
  }

  private async handleProcessarSaldoTarefa(
    data: ProcessarSaldoTarefaJobData,
  ): Promise<void> {
    try {
      await this.processarSaldoTarefaArmazenagemUseCase.execute(data);
    } catch (error) {
      this.logger.error(
        `Erro ao processar saldo da tarefa ${data.tarefaId} da armazenagem`,
        error,
      );
      throw error;
    }
  }
}
