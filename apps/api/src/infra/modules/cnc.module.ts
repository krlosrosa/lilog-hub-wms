import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { CncEventPublisher } from '../../application/services/cnc-event.publisher.js';
import { AdicionarTratativaCncUseCase } from '../../application/usecases/cnc/adicionar-tratativa-cnc.usecase.js';
import { CancelarCncUseCase } from '../../application/usecases/cnc/cancelar-cnc.usecase.js';
import { ConcluirTratativaCncUseCase } from '../../application/usecases/cnc/concluir-tratativa-cnc.usecase.js';
import { CriarCncUseCase } from '../../application/usecases/cnc/criar-cnc.usecase.js';
import { EncerrarCncUseCase } from '../../application/usecases/cnc/encerrar-cnc.usecase.js';
import { GetCncUseCase } from '../../application/usecases/cnc/get-cnc.usecase.js';
import { IniciarAnaliseCncUseCase } from '../../application/usecases/cnc/iniciar-analise-cnc.usecase.js';
import { ListCncTratativasUseCase } from '../../application/usecases/cnc/list-cnc-tratativas.usecase.js';
import { ListCncsUseCase } from '../../application/usecases/cnc/list-cncs.usecase.js';
import { RegistrarEventoCncUseCase } from '../../application/usecases/cnc/registrar-evento-cnc.usecase.js';
import { CNC_REPOSITORY } from '../../domain/repositories/cnc/cnc.repository.js';
import { AdicionarTratativaCncController } from '../../presentation/controllers/cnc/adicionar-tratativa-cnc.controller.js';
import { CancelarCncController } from '../../presentation/controllers/cnc/cancelar-cnc.controller.js';
import { ConcluirTratativaCncController } from '../../presentation/controllers/cnc/concluir-tratativa-cnc.controller.js';
import { EncerrarCncController } from '../../presentation/controllers/cnc/encerrar-cnc.controller.js';
import { GetCncController } from '../../presentation/controllers/cnc/get-cnc.controller.js';
import { IniciarAnaliseCncController } from '../../presentation/controllers/cnc/iniciar-analise-cnc.controller.js';
import { ListCncTratativasController } from '../../presentation/controllers/cnc/list-cnc-tratativas.controller.js';
import { ListCncsController } from '../../presentation/controllers/cnc/list-cncs.controller.js';
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
    IniciarAnaliseCncController,
    EncerrarCncController,
    CancelarCncController,
    AdicionarTratativaCncController,
    ConcluirTratativaCncController,
    ListCncTratativasController,
  ],
  providers: [
    CncProcessor,
    CncEventPublisher,
    CriarCncUseCase,
    RegistrarEventoCncUseCase,
    GetCncUseCase,
    ListCncsUseCase,
    IniciarAnaliseCncUseCase,
    EncerrarCncUseCase,
    CancelarCncUseCase,
    AdicionarTratativaCncUseCase,
    ConcluirTratativaCncUseCase,
    ListCncTratativasUseCase,
    PermissionsGuard,
    {
      provide: CNC_REPOSITORY,
      useClass: CncService,
    },
  ],
  exports: [CncEventPublisher, CNC_REPOSITORY],
})
export class CncModule {}
