import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { CncEventPublisher } from '../../application/services/cnc-event.publisher.js';
import { AprovarCncUseCase } from '../../application/usecases/cnc/aprovar-cnc.usecase.js';
import { CriarCncUseCase } from '../../application/usecases/cnc/criar-cnc.usecase.js';
import { GetCncUseCase } from '../../application/usecases/cnc/get-cnc.usecase.js';
import { ListCncsUseCase } from '../../application/usecases/cnc/list-cncs.usecase.js';
import { RejeitarCncUseCase } from '../../application/usecases/cnc/rejeitar-cnc.usecase.js';
import { CNC_REPOSITORY } from '../../domain/repositories/cnc/cnc.repository.js';
import { AprovarCncController } from '../../presentation/controllers/cnc/aprovar-cnc.controller.js';
import { GetCncController } from '../../presentation/controllers/cnc/get-cnc.controller.js';
import { ListCncsController } from '../../presentation/controllers/cnc/list-cncs.controller.js';
import { RejeitarCncController } from '../../presentation/controllers/cnc/rejeitar-cnc.controller.js';
import { PermissionsGuard } from '../../shared/guards/permissions.guard.js';
import { CncService } from '../db/cnc/cnc.service.js';
import { CncProcessor } from '../queues/cnc.processor.js';
import { CNC_QUEUE } from '../queues/cnc-queue.js';
import { AuditLogModule } from './audit-log.module.js';
import { AuthModule } from './auth.module.js';

@Module({
  imports: [
    AuthModule,
    AuditLogModule,
    BullModule.registerQueue({ name: CNC_QUEUE }),
    BullBoardModule.forFeature({
      name: CNC_QUEUE,
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [
    ListCncsController,
    GetCncController,
    AprovarCncController,
    RejeitarCncController,
  ],
  providers: [
    CncProcessor,
    CncEventPublisher,
    CriarCncUseCase,
    GetCncUseCase,
    ListCncsUseCase,
    AprovarCncUseCase,
    RejeitarCncUseCase,
    PermissionsGuard,
    {
      provide: CNC_REPOSITORY,
      useClass: CncService,
    },
  ],
  exports: [CncEventPublisher],
})
export class CncModule {}
