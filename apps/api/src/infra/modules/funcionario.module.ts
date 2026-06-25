import { Module } from '@nestjs/common';

import { BlockFuncionarioUseCase } from '../../application/usecases/funcionario/block-funcionario.usecase.js';
import { CreateFuncionarioUseCase } from '../../application/usecases/funcionario/create-funcionario.usecase.js';
import { ListFuncionariosUseCase } from '../../application/usecases/funcionario/list-funcionarios.usecase.js';
import { UpdateFuncionarioUseCase } from '../../application/usecases/funcionario/update-funcionario.usecase.js';
import { FUNCIONARIO_REPOSITORY } from '../../domain/repositories/funcionario/funcionario.repository.js';
import { BlockFuncionarioController } from '../../presentation/controllers/funcionario/block-funcionario.controller.js';
import { CreateFuncionarioController } from '../../presentation/controllers/funcionario/create-funcionario.controller.js';
import { ListFuncionariosController } from '../../presentation/controllers/funcionario/list-funcionarios.controller.js';
import { UpdateFuncionarioController } from '../../presentation/controllers/funcionario/update-funcionario.controller.js';
import { PermissionsGuard } from '../../shared/guards/permissions.guard.js';
import { FuncionarioService } from '../db/funcionario/funcionario.service.js';
import { AuthModule } from './auth.module.js';
import { UnidadeModule } from './unidade.module.js';
import { UserModule } from './user.module.js';

@Module({
  imports: [AuthModule, UserModule, UnidadeModule],
  controllers: [
    ListFuncionariosController,
    CreateFuncionarioController,
    UpdateFuncionarioController,
    BlockFuncionarioController,
  ],
  providers: [
    ListFuncionariosUseCase,
    CreateFuncionarioUseCase,
    UpdateFuncionarioUseCase,
    BlockFuncionarioUseCase,
    PermissionsGuard,
    {
      provide: FUNCIONARIO_REPOSITORY,
      useClass: FuncionarioService,
    },
  ],
  exports: [FUNCIONARIO_REPOSITORY],
})
export class FuncionarioModule {}
