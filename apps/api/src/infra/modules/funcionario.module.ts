import { forwardRef, Module } from '@nestjs/common';

import { BlockFuncionarioUseCase } from '../../application/usecases/funcionario/block-funcionario.usecase.js';
import { BulkImportFuncionariosUseCase } from '../../application/usecases/funcionario/bulk-import-funcionarios.usecase.js';
import { CreateFuncionarioUseCase } from '../../application/usecases/funcionario/create-funcionario.usecase.js';
import { ListFuncionariosUseCase } from '../../application/usecases/funcionario/list-funcionarios.usecase.js';
import { UpdateFuncionarioUseCase } from '../../application/usecases/funcionario/update-funcionario.usecase.js';
import { ListPessoasUseCase } from '../../application/usecases/pessoa/list-pessoas.usecase.js';
import { FUNCIONARIO_REPOSITORY } from '../../domain/repositories/funcionario/funcionario.repository.js';
import { PESSOA_REPOSITORY } from '../../domain/repositories/pessoa/pessoa.repository.js';
import { BlockFuncionarioController } from '../../presentation/controllers/funcionario/block-funcionario.controller.js';
import { BulkImportFuncionariosController } from '../../presentation/controllers/funcionario/bulk-import-funcionarios.controller.js';
import { CreateFuncionarioController } from '../../presentation/controllers/funcionario/create-funcionario.controller.js';
import { ListFuncionariosController } from '../../presentation/controllers/funcionario/list-funcionarios.controller.js';
import { UpdateFuncionarioController } from '../../presentation/controllers/funcionario/update-funcionario.controller.js';
import { ListPessoasController } from '../../presentation/controllers/pessoa/list-pessoas.controller.js';
import { PermissionsGuard } from '../../shared/guards/permissions.guard.js';
import { FuncionarioService } from '../db/funcionario/funcionario.service.js';
import { PessoaService } from '../db/pessoa/pessoa.service.js';
import { AuthModule } from './auth.module.js';
import { SessaoOperacaoModule } from './sessao-operacao.module.js';
import { UnidadeModule } from './unidade.module.js';
import { UserModule } from './user.module.js';

@Module({
  imports: [
    AuthModule,
    UserModule,
    UnidadeModule,
    forwardRef(() => SessaoOperacaoModule),
  ],
  controllers: [
    ListFuncionariosController,
    BulkImportFuncionariosController,
    CreateFuncionarioController,
    UpdateFuncionarioController,
    BlockFuncionarioController,
    ListPessoasController,
  ],
  providers: [
    ListFuncionariosUseCase,
    BulkImportFuncionariosUseCase,
    CreateFuncionarioUseCase,
    UpdateFuncionarioUseCase,
    BlockFuncionarioUseCase,
    ListPessoasUseCase,
    PermissionsGuard,
    {
      provide: FUNCIONARIO_REPOSITORY,
      useClass: FuncionarioService,
    },
    {
      provide: PESSOA_REPOSITORY,
      useClass: PessoaService,
    },
  ],
  exports: [FUNCIONARIO_REPOSITORY],
})
export class FuncionarioModule {}
