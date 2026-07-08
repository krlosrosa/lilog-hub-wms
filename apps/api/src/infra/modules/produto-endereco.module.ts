import { Module } from '@nestjs/common';

import { CreateProdutoEnderecoUseCase } from '../../application/usecases/produto-endereco/create-produto-endereco.usecase.js';
import { DeleteProdutoEnderecoUseCase } from '../../application/usecases/produto-endereco/delete-produto-endereco.usecase.js';
import { ExportProdutoEnderecosUseCase } from '../../application/usecases/produto-endereco/export-produto-enderecos.usecase.js';
import { GetProdutoEnderecoUseCase } from '../../application/usecases/produto-endereco/get-produto-endereco.usecase.js';
import { ImportProdutoEnderecosUseCase } from '../../application/usecases/produto-endereco/import-produto-enderecos.usecase.js';
import { ListGruposEnderecosUseCase } from '../../application/usecases/produto-endereco/list-grupos-enderecos.usecase.js';
import { ListSlottingProdutoEnderecosUseCase } from '../../application/usecases/produto-endereco/list-slotting-produto-enderecos.usecase.js';
import { ListProdutoEnderecosUseCase } from '../../application/usecases/produto-endereco/list-produto-enderecos.usecase.js';
import { UpdateProdutoEnderecoUseCase } from '../../application/usecases/produto-endereco/update-produto-endereco.usecase.js';
import { PRODUTO_ENDERECO_REPOSITORY } from '../../domain/repositories/produto-endereco/produto-endereco.repository.js';
import { CreateProdutoEnderecoController } from '../../presentation/controllers/produto-endereco/create-produto-endereco.controller.js';
import { DeleteProdutoEnderecoController } from '../../presentation/controllers/produto-endereco/delete-produto-endereco.controller.js';
import { ExportProdutoEnderecosController } from '../../presentation/controllers/produto-endereco/export-produto-enderecos.controller.js';
import { GetProdutoEnderecoController } from '../../presentation/controllers/produto-endereco/get-produto-endereco.controller.js';
import { ImportProdutoEnderecosController } from '../../presentation/controllers/produto-endereco/import-produto-enderecos.controller.js';
import { ListGruposEnderecosController } from '../../presentation/controllers/produto-endereco/list-grupos-enderecos.controller.js';
import { ListSlottingProdutoEnderecosController } from '../../presentation/controllers/produto-endereco/list-slotting-produto-enderecos.controller.js';
import { ListProdutoEnderecosController } from '../../presentation/controllers/produto-endereco/list-produto-enderecos.controller.js';
import { UpdateProdutoEnderecoController } from '../../presentation/controllers/produto-endereco/update-produto-endereco.controller.js';
import { PermissionsGuard } from '../../shared/guards/permissions.guard.js';
import { ProdutoEnderecoService } from '../db/produto-endereco/produto-endereco.service.js';
import { AuthModule } from './auth.module.js';
import { EnderecoModule } from './endereco.module.js';
import { ProdutoModule } from './produto.module.js';
import { UnidadeModule } from './unidade.module.js';

@Module({
  imports: [AuthModule, EnderecoModule, ProdutoModule, UnidadeModule],
  controllers: [
    ListSlottingProdutoEnderecosController,
    ListGruposEnderecosController,
    ListProdutoEnderecosController,
    ExportProdutoEnderecosController,
    ImportProdutoEnderecosController,
    GetProdutoEnderecoController,
    CreateProdutoEnderecoController,
    UpdateProdutoEnderecoController,
    DeleteProdutoEnderecoController,
  ],
  providers: [
    ListSlottingProdutoEnderecosUseCase,
    ListGruposEnderecosUseCase,
    ListProdutoEnderecosUseCase,
    GetProdutoEnderecoUseCase,
    CreateProdutoEnderecoUseCase,
    UpdateProdutoEnderecoUseCase,
    DeleteProdutoEnderecoUseCase,
    ExportProdutoEnderecosUseCase,
    ImportProdutoEnderecosUseCase,
    PermissionsGuard,
    {
      provide: PRODUTO_ENDERECO_REPOSITORY,
      useClass: ProdutoEnderecoService,
    },
  ],
  exports: [PRODUTO_ENDERECO_REPOSITORY],
})
export class ProdutoEnderecoModule {}
