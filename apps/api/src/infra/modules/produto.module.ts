import { Module } from '@nestjs/common';

import { CreateProdutoUseCase } from '../../application/usecases/produto/create-produto.usecase.js';
import { ImportarProdutosMassaUseCase } from '../../application/usecases/produto/importar-produtos-massa.usecase.js';
import { DeleteProdutoUseCase } from '../../application/usecases/produto/delete-produto.usecase.js';
import { GetProdutoUseCase } from '../../application/usecases/produto/get-produto.usecase.js';
import { ListProdutosUseCase } from '../../application/usecases/produto/list-produtos.usecase.js';
import { UpdateProdutoUseCase } from '../../application/usecases/produto/update-produto.usecase.js';
import { PRODUTO_REPOSITORY } from '../../domain/repositories/produto/produto.repository.js';
import { ProdutoService } from '../db/produto/produto.service.js';
import { CreateProdutoController } from '../../presentation/controllers/produto/create-produto.controller.js';
import { ImportarProdutosMassaController } from '../../presentation/controllers/produto/importar-produtos-massa.controller.js';
import { DeleteProdutoController } from '../../presentation/controllers/produto/delete-produto.controller.js';
import { GetProdutoController } from '../../presentation/controllers/produto/get-produto.controller.js';
import { ListProdutosController } from '../../presentation/controllers/produto/list-produtos.controller.js';
import { UpdateProdutoController } from '../../presentation/controllers/produto/update-produto.controller.js';
import { AuthModule } from './auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [
    ListProdutosController,
    GetProdutoController,
    CreateProdutoController,
    UpdateProdutoController,
    DeleteProdutoController,
    ImportarProdutosMassaController,
  ],
  providers: [
    ListProdutosUseCase,
    GetProdutoUseCase,
    CreateProdutoUseCase,
    UpdateProdutoUseCase,
    DeleteProdutoUseCase,
    ImportarProdutosMassaUseCase,
    {
      provide: PRODUTO_REPOSITORY,
      useClass: ProdutoService,
    },
  ],
  exports: [PRODUTO_REPOSITORY],
})
export class ProdutoModule {}
