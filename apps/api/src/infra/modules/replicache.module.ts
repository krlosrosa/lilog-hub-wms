import { Module } from '@nestjs/common';

import { BuildRecebimentoReplicacheSnapshotService } from '../../application/services/replicache/build-recebimento-replicache-snapshot.service.js';
import { AdicionarItemManualRecebimentoUseCase } from '../../application/usecases/replicache/adicionar-item-manual-recebimento.usecase.js';
import { ProcessReplicachePullUseCase } from '../../application/usecases/replicache/process-replicache-pull.usecase.js';
import { ProcessReplicachePushUseCase } from '../../application/usecases/replicache/process-replicache-push.usecase.js';
import { REPLICACHE_REPOSITORY } from '../../domain/repositories/replicache/replicache.repository.js';
import { ReplicachePullController } from '../../presentation/controllers/replicache/replicache-pull.controller.js';
import { ReplicachePushController } from '../../presentation/controllers/replicache/replicache-push.controller.js';
import { ReplicacheService } from '../db/replicache/replicache.service.js';
import { OperacionalModule } from './operacional.module.js';
import { ProdutoModule } from './produto.module.js';
import { RecebimentoModule } from './recebimento.module.js';
import { UserModule } from './user.module.js';

@Module({
  imports: [RecebimentoModule, ProdutoModule, UserModule, OperacionalModule],
  controllers: [ReplicachePullController, ReplicachePushController],
  providers: [
    ProcessReplicachePullUseCase,
    ProcessReplicachePushUseCase,
    BuildRecebimentoReplicacheSnapshotService,
    AdicionarItemManualRecebimentoUseCase,
    {
      provide: REPLICACHE_REPOSITORY,
      useClass: ReplicacheService,
    },
  ],
})
export class ReplicacheModule {}
