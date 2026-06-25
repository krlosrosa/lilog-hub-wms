import { Module } from '@nestjs/common';

import { CreateProdutoEnderecoUseCase } from '../../application/usecases/produto-endereco/create-produto-endereco.usecase.js';
import { DeleteProdutoEnderecoUseCase } from '../../application/usecases/produto-endereco/delete-produto-endereco.usecase.js';
import { GetProdutoEnderecoUseCase } from '../../application/usecases/produto-endereco/get-produto-endereco.usecase.js';
import { ListProdutoEnderecosUseCase } from '../../application/usecases/produto-endereco/list-produto-enderecos.usecase.js';
import { UpdateProdutoEnderecoUseCase } from '../../application/usecases/produto-endereco/update-produto-endereco.usecase.js';
import { PRODUTO_ENDERECO_REPOSITORY } from '../../domain/repositories/produto-endereco/produto-endereco.repository.js';
import { CreateProdutoEnderecoController } from '../../presentation/controllers/produto-endereco/create-produto-endereco.controller.js';
import { DeleteProdutoEnderecoController } from '../../presentation/controllers/produto-endereco/delete-produto-endereco.controller.js';
import { GetProdutoEnderecoController } from '../../presentation/controllers/produto-endereco/get-produto-endereco.controller.js';
import { ListProdutoEnderecosController } from '../../presentation/controllers/produto-endereco/list-produto-enderecos.controller.js';
import { UpdateProdutoEnderecoController } from '../../presentation/controllers/produto-endereco/update-produto-endereco.controller.js';
import { PermissionsGuard } from '../../shared/guards/permissions.guard.js';
import { ProdutoEnderecoService } from '../db/produto-endereco/produto-endereco.service.js';
import { AuthModule } from './auth.module.js';
import { EnderecoModule } from './endereco.module.js';

@Module({
  imports: [AuthModule, EnderecoModule],
  controllers: [
    ListProdutoEnderecosController,
    GetProdutoEnderecoController,
    CreateProdutoEnderecoController,
    UpdateProdutoEnderecoController,
    DeleteProdutoEnderecoController,
  ],
  providers: [
    ListProdutoEnderecosUseCase,
    GetProdutoEnderecoUseCase,
    CreateProdutoEnderecoUseCase,
    UpdateProdutoEnderecoUseCase,
    DeleteProdutoEnderecoUseCase,
    PermissionsGuard,
    {
      provide: PRODUTO_ENDERECO_REPOSITORY,
      useClass: ProdutoEnderecoService,
    },
  ],
  exports: [PRODUTO_ENDERECO_REPOSITORY],
})
export class ProdutoEnderecoModule {}
