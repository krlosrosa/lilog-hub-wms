import { Module } from '@nestjs/common';

import { BlockUserUseCase } from '../../application/usecases/user/block-user.usecase.js';
import { CreateUserUseCase } from '../../application/usecases/user/create-user.usecase.js';
import { ListUsersUseCase } from '../../application/usecases/user/list-users.usecase.js';
import { ResetUserPasswordUseCase } from '../../application/usecases/user/reset-user-password.usecase.js';
import { UnblockUserUseCase } from '../../application/usecases/user/unblock-user.usecase.js';
import { UpdateUserUseCase } from '../../application/usecases/user/update-user.usecase.js';
import { FUNCIONARIO_REPOSITORY } from '../../domain/repositories/funcionario/funcionario.repository.js';
import { USER_REPOSITORY } from '../../domain/repositories/user/user.repository.js';
import { BlockUserController } from '../../presentation/controllers/user/block-user.controller.js';
import { CreateUserController } from '../../presentation/controllers/user/create-user.controller.js';
import { ListUsersController } from '../../presentation/controllers/user/list-users.controller.js';
import { ResetUserPasswordController } from '../../presentation/controllers/user/reset-user-password.controller.js';
import { UnblockUserController } from '../../presentation/controllers/user/unblock-user.controller.js';
import { UpdateUserController } from '../../presentation/controllers/user/update-user.controller.js';
import { ListOperatorsController } from '../../presentation/controllers/user/list-operators.controller.js';
import { PermissionsGuard } from '../../shared/guards/permissions.guard.js';
import { FuncionarioService } from '../db/funcionario/funcionario.service.js';
import { UserService } from '../db/user/user.service.js';
import { AuthModule } from './auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [
    ListUsersController,
    CreateUserController,
    UpdateUserController,
    ResetUserPasswordController,
    BlockUserController,
    UnblockUserController,
    ListOperatorsController,
  ],
  providers: [
    ListUsersUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    ResetUserPasswordUseCase,
    BlockUserUseCase,
    UnblockUserUseCase,
    PermissionsGuard,
    {
      provide: USER_REPOSITORY,
      useClass: UserService,
    },
    {
      provide: FUNCIONARIO_REPOSITORY,
      useClass: FuncionarioService,
    },
  ],
  exports: [CreateUserUseCase, USER_REPOSITORY, FUNCIONARIO_REPOSITORY],
})
export class UserModule {}
