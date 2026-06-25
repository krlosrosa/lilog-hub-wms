import { Module } from '@nestjs/common';

import { DocaEventPublisher } from '../../application/services/doca-event.publisher.js';
import { BlockDocaUseCase } from '../../application/usecases/doca/block-doca.usecase.js';
import { CreateDocaUseCase } from '../../application/usecases/doca/create-doca.usecase.js';
import { DeleteDocaUseCase } from '../../application/usecases/doca/delete-doca.usecase.js';
import { GetDocaUseCase } from '../../application/usecases/doca/get-doca.usecase.js';
import { ListDocasUseCase } from '../../application/usecases/doca/list-docas.usecase.js';
import { SetMaintenanceDocaUseCase } from '../../application/usecases/doca/set-maintenance-doca.usecase.js';
import { UnblockDocaUseCase } from '../../application/usecases/doca/unblock-doca.usecase.js';
import { UpdateDocaUseCase } from '../../application/usecases/doca/update-doca.usecase.js';
import { CancelarOperacaoDocaUseCase } from '../../application/usecases/operacao-doca/cancelar-operacao-doca.usecase.js';
import { CreateOperacaoDocaUseCase } from '../../application/usecases/operacao-doca/create-operacao-doca.usecase.js';
import { FinalizarOperacaoDocaUseCase } from '../../application/usecases/operacao-doca/finalizar-operacao-doca.usecase.js';
import { GetOperacaoDocaUseCase } from '../../application/usecases/operacao-doca/get-operacao-doca.usecase.js';
import { IniciarOperacaoDocaUseCase } from '../../application/usecases/operacao-doca/iniciar-operacao-doca.usecase.js';
import { ListOperacoesDocaUseCase } from '../../application/usecases/operacao-doca/list-operacoes-doca.usecase.js';
import { DOCA_REPOSITORY } from '../../domain/repositories/doca/doca.repository.js';
import { OPERACAO_DOCA_REPOSITORY } from '../../domain/repositories/operacao-doca/operacao-doca.repository.js';
import { BlockDocaController } from '../../presentation/controllers/doca/block-doca.controller.js';
import { CancelarOperacaoDocaController } from '../../presentation/controllers/doca/cancelar-operacao-doca.controller.js';
import { CreateDocaController } from '../../presentation/controllers/doca/create-doca.controller.js';
import { CreateOperacaoDocaController } from '../../presentation/controllers/doca/create-operacao-doca.controller.js';
import { DeleteDocaController } from '../../presentation/controllers/doca/delete-doca.controller.js';
import { FinalizarOperacaoDocaController } from '../../presentation/controllers/doca/finalizar-operacao-doca.controller.js';
import { GetDocaController } from '../../presentation/controllers/doca/get-doca.controller.js';
import { GetOperacaoDocaController } from '../../presentation/controllers/doca/get-operacao-doca.controller.js';
import { IniciarOperacaoDocaController } from '../../presentation/controllers/doca/iniciar-operacao-doca.controller.js';
import { ListDocasController } from '../../presentation/controllers/doca/list-docas.controller.js';
import { ListOperacoesDocaController } from '../../presentation/controllers/doca/list-operacoes-doca.controller.js';
import { SetMaintenanceDocaController } from '../../presentation/controllers/doca/set-maintenance-doca.controller.js';
import { UnblockDocaController } from '../../presentation/controllers/doca/unblock-doca.controller.js';
import { UpdateDocaController } from '../../presentation/controllers/doca/update-doca.controller.js';
import { PermissionsGuard } from '../../shared/guards/permissions.guard.js';
import { DocaService } from '../db/doca/doca.service.js';
import { OperacaoDocaService } from '../db/operacao-doca/operacao-doca.service.js';
import { AuditLogModule } from './audit-log.module.js';
import { AuthModule } from './auth.module.js';
import { UnidadeModule } from './unidade.module.js';

@Module({
  imports: [AuthModule, AuditLogModule, UnidadeModule],
  controllers: [
    ListOperacoesDocaController,
    GetOperacaoDocaController,
    IniciarOperacaoDocaController,
    FinalizarOperacaoDocaController,
    CancelarOperacaoDocaController,
    ListDocasController,
    CreateDocaController,
    CreateOperacaoDocaController,
    GetDocaController,
    UpdateDocaController,
    BlockDocaController,
    UnblockDocaController,
    SetMaintenanceDocaController,
    DeleteDocaController,
  ],
  providers: [
    ListDocasUseCase,
    GetDocaUseCase,
    CreateDocaUseCase,
    UpdateDocaUseCase,
    BlockDocaUseCase,
    UnblockDocaUseCase,
    SetMaintenanceDocaUseCase,
    DeleteDocaUseCase,
    ListOperacoesDocaUseCase,
    GetOperacaoDocaUseCase,
    CreateOperacaoDocaUseCase,
    IniciarOperacaoDocaUseCase,
    FinalizarOperacaoDocaUseCase,
    CancelarOperacaoDocaUseCase,
    DocaEventPublisher,
    PermissionsGuard,
    {
      provide: DOCA_REPOSITORY,
      useClass: DocaService,
    },
    {
      provide: OPERACAO_DOCA_REPOSITORY,
      useClass: OperacaoDocaService,
    },
  ],
  exports: [DOCA_REPOSITORY],
})
export class DocaModule {}
