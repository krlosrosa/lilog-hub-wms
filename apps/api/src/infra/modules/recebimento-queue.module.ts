import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { RecebimentoSaldoEventPublisher } from '../../application/services/recebimento-saldo-event.publisher.js';
import { ProcessarSaldoRecebimentoUseCase } from '../../application/usecases/recebimento/processar-saldo-recebimento.usecase.js';
import { ProcessarSaldoRecebimentoProcessor } from '../queues/processar-saldo-recebimento.processor.js';
import { RECEBIMENTO_QUEUE } from '../queues/recebimento.queue.js';
import { EstoqueModule } from './estoque.module.js';

@Module({
  imports: [
    EstoqueModule,
    BullModule.registerQueue({ name: RECEBIMENTO_QUEUE }),
    BullBoardModule.forFeature({
      name: RECEBIMENTO_QUEUE,
      adapter: BullMQAdapter,
    }),
  ],
  providers: [
    ProcessarSaldoRecebimentoProcessor,
    ProcessarSaldoRecebimentoUseCase,
    RecebimentoSaldoEventPublisher,
  ],
  exports: [RecebimentoSaldoEventPublisher],
})
export class RecebimentoQueueModule {}
