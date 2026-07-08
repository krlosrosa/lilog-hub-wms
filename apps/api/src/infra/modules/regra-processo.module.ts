import { Module } from '@nestjs/common';

import { CreateRegraProcessoUseCase } from '../../application/usecases/regra-processo/create-regra-processo.usecase.js';
import { DeleteRegraProcessoUseCase } from '../../application/usecases/regra-processo/delete-regra-processo.usecase.js';
import { ExecutarRegrasProcessoUseCase } from '../../application/usecases/regra-processo/executar-regras-processo.usecase.js';
import { FindRegraProcessoUseCase } from '../../application/usecases/regra-processo/find-regra-processo.usecase.js';
import { ListRegrasProcessoUseCase } from '../../application/usecases/regra-processo/list-regras-processo.usecase.js';
import { UpdateRegraProcessoUseCase } from '../../application/usecases/regra-processo/update-regra-processo.usecase.js';
import { RuleEngineService } from '../../application/services/regra-processo/rule-engine.service.js';
import { REGRA_PROCESSO_REPOSITORY } from '../../domain/repositories/regra-processo/regra-processo.repository.js';
import { CreateRegraProcessoController } from '../../presentation/controllers/regra-processo/create-regra-processo.controller.js';
import { DeleteRegraProcessoController } from '../../presentation/controllers/regra-processo/delete-regra-processo.controller.js';
import { FindRegraProcessoController } from '../../presentation/controllers/regra-processo/find-regra-processo.controller.js';
import { ListRegrasProcessoController } from '../../presentation/controllers/regra-processo/list-regras-processo.controller.js';
import { UpdateRegraProcessoController } from '../../presentation/controllers/regra-processo/update-regra-processo.controller.js';
import { RegraProcessoService } from '../db/regra-processo/regra-processo.service.js';
import { AuthModule } from './auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [
    CreateRegraProcessoController,
    ListRegrasProcessoController,
    FindRegraProcessoController,
    UpdateRegraProcessoController,
    DeleteRegraProcessoController,
  ],
  providers: [
    CreateRegraProcessoUseCase,
    ListRegrasProcessoUseCase,
    FindRegraProcessoUseCase,
    UpdateRegraProcessoUseCase,
    DeleteRegraProcessoUseCase,
    ExecutarRegrasProcessoUseCase,
    RuleEngineService,
    {
      provide: REGRA_PROCESSO_REPOSITORY,
      useClass: RegraProcessoService,
    },
  ],
  exports: [ExecutarRegrasProcessoUseCase, RuleEngineService],
})
export class RegraProcessoModule {}
