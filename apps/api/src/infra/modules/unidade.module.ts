import { Module } from '@nestjs/common';

import { AddCentroUseCase } from '../../application/usecases/unidade/add-centro.usecase.js';
import { CreateUnidadeUseCase } from '../../application/usecases/unidade/create-unidade.usecase.js';
import { DeleteCentroUseCase } from '../../application/usecases/unidade/delete-centro.usecase.js';
import { DeleteUnidadeUseCase } from '../../application/usecases/unidade/delete-unidade.usecase.js';
import { GetUnidadeUseCase } from '../../application/usecases/unidade/get-unidade.usecase.js';
import { ListCentrosUseCase } from '../../application/usecases/unidade/list-centros.usecase.js';
import { ListUnidadesUseCase } from '../../application/usecases/unidade/list-unidades.usecase.js';
import { UpdateCentroUseCase } from '../../application/usecases/unidade/update-centro.usecase.js';
import { UpdateUnidadeUseCase } from '../../application/usecases/unidade/update-unidade.usecase.js';
import { UNIDADE_REPOSITORY } from '../../domain/repositories/unidade/unidade.repository.js';
import { UnidadeService } from '../db/unidade/unidade.service.js';
import { AddCentroController } from '../../presentation/controllers/unidade/add-centro.controller.js';
import { CreateUnidadeController } from '../../presentation/controllers/unidade/create-unidade.controller.js';
import { DeleteCentroController } from '../../presentation/controllers/unidade/delete-centro.controller.js';
import { DeleteUnidadeController } from '../../presentation/controllers/unidade/delete-unidade.controller.js';
import { GetUnidadeController } from '../../presentation/controllers/unidade/get-unidade.controller.js';
import { ListCentrosController } from '../../presentation/controllers/unidade/list-centros.controller.js';
import { ListUnidadesController } from '../../presentation/controllers/unidade/list-unidades.controller.js';
import { UpdateCentroController } from '../../presentation/controllers/unidade/update-centro.controller.js';
import { UpdateUnidadeController } from '../../presentation/controllers/unidade/update-unidade.controller.js';
import { AuthModule } from './auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [
    ListUnidadesController,
    ListCentrosController,
    GetUnidadeController,
    CreateUnidadeController,
    UpdateUnidadeController,
    DeleteUnidadeController,
    AddCentroController,
    UpdateCentroController,
    DeleteCentroController,
  ],
  providers: [
    ListUnidadesUseCase,
    ListCentrosUseCase,
    GetUnidadeUseCase,
    CreateUnidadeUseCase,
    UpdateUnidadeUseCase,
    DeleteUnidadeUseCase,
    AddCentroUseCase,
    UpdateCentroUseCase,
    DeleteCentroUseCase,
    {
      provide: UNIDADE_REPOSITORY,
      useClass: UnidadeService,
    },
  ],
  exports: [UNIDADE_REPOSITORY],
})
export class UnidadeModule {}
