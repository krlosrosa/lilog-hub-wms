import { Module } from '@nestjs/common';

import { PushRecebimentoDemandUseCase } from '../../application/usecases/pwa/push-recebimento-demand.usecase.js';
import { PushRecebimentoDemandController } from '../../presentation/controllers/pwa/push-recebimento-demand.controller.js';
import { RecebimentoModule } from './recebimento.module.js';
import { SyncModule } from './sync.module.js';
import { UserModule } from './user.module.js';

@Module({
  imports: [RecebimentoModule, UserModule, SyncModule],
  controllers: [PushRecebimentoDemandController],
  providers: [PushRecebimentoDemandUseCase],
})
export class PwaSyncModule {}
