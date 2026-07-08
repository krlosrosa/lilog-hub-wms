import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { TransporteEventPublisher } from '../../application/services/transporte-event.publisher.js';
import { RecalcularStatusTransporteUseCase } from '../../application/usecases/expedicao/recalcular-status-transporte.usecase.js';
import { SincronizarViagemRavexUseCase } from '../../application/usecases/expedicao/sincronizar-viagem-ravex.usecase.js';
import { GerarDemandaDevolucaoViagemUseCase } from '../../application/usecases/devolucao/gerar-demanda-devolucao-viagem.usecase.js';
import { DEVOLUCAO_REPOSITORY } from '../../domain/repositories/devolucao/devolucao.repository.js';
import { DevolucaoService } from '../db/devolucao/devolucao.service.js';
import { TransporteStatusProcessor } from '../queues/transporte-status.processor.js';
import { EXPEDICAO_TRANSPORTE_QUEUE } from '../queues/expedicao-transporte.queue.js';
import { ExpedicaoCoreModule } from './expedicao-core.module.js';
import { ProdutoModule } from './produto.module.js';
import { RavexModule } from './ravex.module.js';

@Module({
  imports: [
    ExpedicaoCoreModule,
    ProdutoModule,
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
    GerarDemandaDevolucaoViagemUseCase,
    {
      provide: DEVOLUCAO_REPOSITORY,
      useClass: DevolucaoService,
    },
  ],
  exports: [TransporteEventPublisher],
})
export class ExpedicaoTransporteQueueModule {}
