import { Module } from '@nestjs/common';

import { GetProductsDatasetUseCase } from '../../application/usecases/sync/get-products-dataset.usecase.js';
import { GetProductsDatasetController } from '../../presentation/controllers/sync/get-products-dataset.controller.js';
import { UserModule } from './user.module.js';
import { ProdutoModule } from './produto.module.js';

@Module({
  imports: [UserModule, ProdutoModule],
  controllers: [GetProductsDatasetController],
  providers: [GetProductsDatasetUseCase],
  exports: [GetProductsDatasetUseCase],
})
export class SyncModule {}
