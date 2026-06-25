import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { TransporteEventPublisher } from '../../application/services/transporte-event.publisher.js';
import { RecalcularStatusTransporteUseCase } from '../../application/usecases/expedicao/recalcular-status-transporte.usecase.js';
import { SincronizarViagemRavexUseCase } from '../../application/usecases/expedicao/sincronizar-viagem-ravex.usecase.js';
import { TRANSPORTE_REPOSITORY } from '../../domain/repositories/expedicao/transporte.repository.js';
import { TransporteService } from '../db/expedicao/transporte.service.js';
import { TransporteStatusProcessor } from '../queues/transporte-status.processor.js';
import { EXPEDICAO_TRANSPORTE_QUEUE } from '../queues/expedicao-transporte.queue.js';
import { RavexModule } from './ravex.module.js';

@Module({
  imports: [
    BullModule.registerQueue({ name: EXPEDICAO_TRANSPORTE_QUEUE }),
    BullBoardModule.forFeature({
      name: EXPEDICAO_TRANSPORTE_QUEUE,
      adapter: BullMQAdapter,
    }),
    RavexModule,
  ],
  providers: [
    TransporteStatusProcessor,
    TransporteEventPublisher,
    RecalcularStatusTransporteUseCase,
    SincronizarViagemRavexUseCase,
    {
      provide: TRANSPORTE_REPOSITORY,
      useClass: TransporteService,
    },
  ],
  exports: [TransporteEventPublisher],
})
export class ExpedicaoTransporteQueueModule {}
