import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { InventarioDivergenciaEventPublisher } from '../../application/services/inventario/inventario-divergencia-event.publisher.js';
import { AplicarDivergenciaInventarioUseCase } from '../../application/usecases/inventario/divergencia.usecases.js';
import { INVENTARIO_REPOSITORY } from '../../domain/repositories/inventario/inventario.repository.js';
import { InventarioService } from '../db/inventario/inventario.service.js';
import { InventarioDivergenciaProcessor } from '../queues/inventario-divergencia.processor.js';
import { INVENTARIO_DIVERGENCIA_QUEUE } from '../queues/inventario-divergencia.queue.js';
import { EstoqueModule } from './estoque.module.js';

@Module({
  imports: [
    EstoqueModule,
    BullModule.registerQueue({ name: INVENTARIO_DIVERGENCIA_QUEUE }),
    BullBoardModule.forFeature({
      name: INVENTARIO_DIVERGENCIA_QUEUE,
      adapter: BullMQAdapter,
    }),
  ],
  providers: [
    InventarioDivergenciaProcessor,
    AplicarDivergenciaInventarioUseCase,
    InventarioDivergenciaEventPublisher,
    {
      provide: INVENTARIO_REPOSITORY,
      useClass: InventarioService,
    },
  ],
  exports: [InventarioDivergenciaEventPublisher],
})
export class InventarioDivergenciaQueueModule {}
