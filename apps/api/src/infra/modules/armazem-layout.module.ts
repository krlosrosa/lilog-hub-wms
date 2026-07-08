import { Module } from '@nestjs/common';

import { GetArmazemLayoutOcupacaoUseCase } from '../../application/usecases/armazem-layout/get-armazem-layout-ocupacao.usecase.js';
import { GetArmazemLayoutUseCase } from '../../application/usecases/armazem-layout/get-armazem-layout.usecase.js';
import { SaveArmazemLayoutUseCase } from '../../application/usecases/armazem-layout/save-armazem-layout.usecase.js';
import { VincularSlotEnderecoArmazemLayoutUseCase } from '../../application/usecases/armazem-layout/vincular-slot-endereco-armazem-layout.usecase.js';
import { ARMAZEM_LAYOUT_REPOSITORY } from '../../domain/repositories/armazem-layout/armazem-layout.repository.js';
import { GetArmazemLayoutOcupacaoController } from '../../presentation/controllers/armazem-layout/get-armazem-layout-ocupacao.controller.js';
import { GetArmazemLayoutController } from '../../presentation/controllers/armazem-layout/get-armazem-layout.controller.js';
import { SaveArmazemLayoutController } from '../../presentation/controllers/armazem-layout/save-armazem-layout.controller.js';
import { VincularSlotEnderecoArmazemLayoutController } from '../../presentation/controllers/armazem-layout/vincular-slot-endereco-armazem-layout.controller.js';
import { PermissionsGuard } from '../../shared/guards/permissions.guard.js';
import { ArmazemLayoutService } from '../db/armazem-layout/armazem-layout.service.js';
import { AuthModule } from './auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [
    GetArmazemLayoutController,
    SaveArmazemLayoutController,
    GetArmazemLayoutOcupacaoController,
    VincularSlotEnderecoArmazemLayoutController,
  ],
  providers: [
    GetArmazemLayoutUseCase,
    SaveArmazemLayoutUseCase,
    GetArmazemLayoutOcupacaoUseCase,
    VincularSlotEnderecoArmazemLayoutUseCase,
    PermissionsGuard,
    {
      provide: ARMAZEM_LAYOUT_REPOSITORY,
      useClass: ArmazemLayoutService,
    },
  ],
})
export class ArmazemLayoutModule {}
