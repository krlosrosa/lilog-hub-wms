import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { DevolucaoNotificacaoEventPublisher } from '../../application/services/devolucao/devolucao-notificacao-event.publisher.js';
import { NotificarAnomaliaTransportadoraDevolucaoUseCase } from '../../application/usecases/devolucao/notificar-anomalia-transportadora-devolucao.usecase.js';
import { DEVOLUCAO_REPOSITORY } from '../../domain/repositories/devolucao/devolucao.repository.js';
import { TRANSPORTADORA_REPOSITORY } from '../../domain/repositories/transportadora/transportadora.repository.js';
import { DevolucaoService } from '../db/devolucao/devolucao.service.js';
import { TransportadoraService } from '../db/transportadora/transportadora.service.js';
import { NOTIFICACAO_DEVOLUCAO_QUEUE } from '../queues/notificacao-devolucao.queue.js';
import { NotificacaoDevolucaoProcessor } from '../queues/notificacao-devolucao.processor.js';
import { DocumentoModule } from './documento.module.js';

@Module({
  imports: [
    DocumentoModule,
    BullModule.registerQueue({ name: NOTIFICACAO_DEVOLUCAO_QUEUE }),
    BullBoardModule.forFeature({
      name: NOTIFICACAO_DEVOLUCAO_QUEUE,
      adapter: BullMQAdapter,
    }),
  ],
  providers: [
    NotificacaoDevolucaoProcessor,
    NotificarAnomaliaTransportadoraDevolucaoUseCase,
    DevolucaoNotificacaoEventPublisher,
    {
      provide: DEVOLUCAO_REPOSITORY,
      useClass: DevolucaoService,
    },
    {
      provide: TRANSPORTADORA_REPOSITORY,
      useClass: TransportadoraService,
    },
  ],
  exports: [DevolucaoNotificacaoEventPublisher],
})
export class NotificacaoDevolucaoQueueModule {}
