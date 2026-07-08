import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { DevolucaoCobrancaEventPublisher } from '../../application/services/devolucao/devolucao-cobranca-event.publisher.js';
import { GerarProcessoDebitoDevolucaoUseCase } from '../../application/usecases/cobranca-transportadora/gerar-processo-debito-devolucao.usecase.js';
import { DEVOLUCAO_REPOSITORY } from '../../domain/repositories/devolucao/devolucao.repository.js';
import { DevolucaoService } from '../db/devolucao/devolucao.service.js';
import { COBRANCA_TRANSPORTADORA_QUEUE } from '../queues/cobranca-transportadora.queue.js';
import { GerarProcessoDebitoProcessor } from '../queues/gerar-processo-debito.processor.js';
import { CobrancaTransportadoraModule } from './cobranca-transportadora.module.js';

@Module({
  imports: [
    BullModule.registerQueue({ name: COBRANCA_TRANSPORTADORA_QUEUE }),
    BullBoardModule.forFeature({
      name: COBRANCA_TRANSPORTADORA_QUEUE,
      adapter: BullMQAdapter,
    }),
    CobrancaTransportadoraModule,
  ],
  providers: [
    GerarProcessoDebitoProcessor,
    GerarProcessoDebitoDevolucaoUseCase,
    DevolucaoCobrancaEventPublisher,
    {
      provide: DEVOLUCAO_REPOSITORY,
      useClass: DevolucaoService,
    },
  ],
  exports: [DevolucaoCobrancaEventPublisher],
})
export class CobrancaTransportadoraQueueModule {}
