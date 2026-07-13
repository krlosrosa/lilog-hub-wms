import { Module } from '@nestjs/common';

import {
  ProcessSyncBatchUseCase,
  SYNC_ADAPTER_REGISTRY,
} from '../../application/usecases/sync/process-sync-batch.usecase.js';
import { GetProductsDatasetUseCase } from '../../application/usecases/sync/get-products-dataset.usecase.js';
import { GetRecebimentoV2ProcessesUseCase } from '../../application/usecases/sync/get-recebimento-v2-processes.usecase.js';
import { GetRecebimentoV2PackageUseCase } from '../../application/usecases/sync/get-recebimento-v2-package.usecase.js';
import { GetRecebimentoV2SnapshotUseCase } from '../../application/usecases/sync/get-recebimento-v2-snapshot.usecase.js';
import { GetRecebimentoReferenceDataUseCase } from '../../application/usecases/sync/get-recebimento-reference-data.usecase.js';
import { RecebimentoV2SyncAdapter } from '../../application/usecases/sync/adapters/recebimento-v2-sync.adapter.js';
import { SyncAdapterRegistry } from '../../application/usecases/sync/adapters/sync-adapter.registry.js';
import { SYNC_REPOSITORY } from '../../domain/repositories/sync/sync.repository.js';
import { ProcessSyncBatchController } from '../../presentation/controllers/sync/process-sync-batch.controller.js';
import { GetRecebimentoV2ProcessesController } from '../../presentation/controllers/sync/get-recebimento-v2-processes.controller.js';
import { GetRecebimentoV2PackageController } from '../../presentation/controllers/sync/get-recebimento-v2-package.controller.js';
import { GetRecebimentoV2SnapshotController } from '../../presentation/controllers/sync/get-recebimento-v2-snapshot.controller.js';
import { GetProductsDatasetController } from '../../presentation/controllers/sync/get-products-dataset.controller.js';
import { GetRecebimentoReferenceController } from '../../presentation/controllers/sync/get-recebimento-reference.controller.js';
import { SyncService } from '../db/sync/sync.service.js';
import { RecebimentoModule } from './recebimento.module.js';
import { UserModule } from './user.module.js';
import { ProdutoModule } from './produto.module.js';
import { DocaModule } from './doca.module.js';
import { OperacionalModule } from './operacional.module.js';

@Module({
  imports: [RecebimentoModule, UserModule, ProdutoModule, DocaModule, OperacionalModule],
  controllers: [
    ProcessSyncBatchController,
    GetRecebimentoV2ProcessesController,
    GetRecebimentoV2PackageController,
    GetRecebimentoV2SnapshotController,
    GetProductsDatasetController,
    GetRecebimentoReferenceController,
  ],
  providers: [
    ProcessSyncBatchUseCase,
    GetProductsDatasetUseCase,
    GetRecebimentoV2ProcessesUseCase,
    GetRecebimentoV2PackageUseCase,
    GetRecebimentoV2SnapshotUseCase,
    GetRecebimentoReferenceDataUseCase,
    RecebimentoV2SyncAdapter,
    {
      provide: SYNC_REPOSITORY,
      useClass: SyncService,
    },
    {
      provide: SYNC_ADAPTER_REGISTRY,
      useFactory: (recebimentoV2Adapter: RecebimentoV2SyncAdapter) => {
        const registry = new SyncAdapterRegistry();
        registry.register(recebimentoV2Adapter);
        return registry;
      },
      inject: [RecebimentoV2SyncAdapter],
    },
  ],
  exports: [ProcessSyncBatchUseCase, SYNC_REPOSITORY],
})
export class SyncModule {}
