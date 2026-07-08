import { Module } from '@nestjs/common';

import { EnderecoEventPublisher } from '../../application/services/endereco-event.publisher.js';
import { BlockEnderecoUseCase } from '../../application/usecases/endereco/block-endereco.usecase.js';
import { CreateEnderecoUseCase } from '../../application/usecases/endereco/create-endereco.usecase.js';
import { DeleteEnderecoUseCase } from '../../application/usecases/endereco/delete-endereco.usecase.js';
import { FinishEnderecoInventoryUseCase } from '../../application/usecases/endereco/finish-endereco-inventory.usecase.js';
import { GetEnderecoUseCase } from '../../application/usecases/endereco/get-endereco.usecase.js';
import { InactivateEnderecoUseCase } from '../../application/usecases/endereco/inactivate-endereco.usecase.js';
import {
  GetEnderecoKpiUseCase,
  ListEnderecosUseCase,
} from '../../application/usecases/endereco/list-enderecos.usecase.js';
import { StartEnderecoInventoryUseCase } from '../../application/usecases/endereco/start-endereco-inventory.usecase.js';
import { UnblockEnderecoUseCase } from '../../application/usecases/endereco/unblock-endereco.usecase.js';
import { UpdateEnderecoUseCase } from '../../application/usecases/endereco/update-endereco.usecase.js';
import { ImportEnderecosUseCase } from '../../application/usecases/endereco/import-enderecos.usecase.js';
import { ENDERECO_REPOSITORY } from '../../domain/repositories/endereco/endereco.repository.js';
import { ImportEnderecosController } from '../../presentation/controllers/endereco/import-enderecos.controller.js';
import { BlockEnderecoController } from '../../presentation/controllers/endereco/block-endereco.controller.js';
import { CreateEnderecoController } from '../../presentation/controllers/endereco/create-endereco.controller.js';
import { DeleteEnderecoController } from '../../presentation/controllers/endereco/delete-endereco.controller.js';
import { FinishEnderecoInventoryController } from '../../presentation/controllers/endereco/finish-endereco-inventory.controller.js';
import { GetEnderecoController } from '../../presentation/controllers/endereco/get-endereco.controller.js';
import { InactivateEnderecoController } from '../../presentation/controllers/endereco/inactivate-endereco.controller.js';
import { ListEnderecoZonasController } from '../../presentation/controllers/endereco/list-endereco-zonas.controller.js';
import { ListEnderecoRuasController } from '../../presentation/controllers/endereco/list-endereco-ruas.controller.js';
import { ListEnderecosController } from '../../presentation/controllers/endereco/list-enderecos.controller.js';
import { StartEnderecoInventoryController } from '../../presentation/controllers/endereco/start-endereco-inventory.controller.js';
import { UnblockEnderecoController } from '../../presentation/controllers/endereco/unblock-endereco.controller.js';
import { UpdateEnderecoController } from '../../presentation/controllers/endereco/update-endereco.controller.js';
import { PermissionsGuard } from '../../shared/guards/permissions.guard.js';
import { EnderecoService } from '../db/endereco/endereco.service.js';
import { AuditLogModule } from './audit-log.module.js';
import { AuthModule } from './auth.module.js';
import { UnidadeModule } from './unidade.module.js';

@Module({
  imports: [AuthModule, AuditLogModule, UnidadeModule],
  controllers: [
    ListEnderecoZonasController,
    ListEnderecoRuasController,
    ListEnderecosController,
    GetEnderecoController,
    CreateEnderecoController,
    UpdateEnderecoController,
    DeleteEnderecoController,
    BlockEnderecoController,
    UnblockEnderecoController,
    InactivateEnderecoController,
    StartEnderecoInventoryController,
    FinishEnderecoInventoryController,
    ImportEnderecosController,
  ],
  providers: [
    ListEnderecosUseCase,
    GetEnderecoKpiUseCase,
    GetEnderecoUseCase,
    CreateEnderecoUseCase,
    UpdateEnderecoUseCase,
    DeleteEnderecoUseCase,
    BlockEnderecoUseCase,
    UnblockEnderecoUseCase,
    InactivateEnderecoUseCase,
    StartEnderecoInventoryUseCase,
    FinishEnderecoInventoryUseCase,
    ImportEnderecosUseCase,
    EnderecoEventPublisher,
    PermissionsGuard,
    {
      provide: ENDERECO_REPOSITORY,
      useClass: EnderecoService,
    },
  ],
  exports: [ENDERECO_REPOSITORY],
})
export class EnderecoModule {}
