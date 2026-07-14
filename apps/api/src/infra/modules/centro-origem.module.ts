import { Module } from '@nestjs/common';

import { CreateCentroOrigemUseCase } from '../../application/usecases/centro-origem/create-centro-origem.usecase.js';
import { DeleteCentroOrigemUseCase } from '../../application/usecases/centro-origem/delete-centro-origem.usecase.js';
import { GetCentroOrigemUseCase } from '../../application/usecases/centro-origem/get-centro-origem.usecase.js';
import { ListCentrosOrigemUseCase } from '../../application/usecases/centro-origem/list-centros-origem.usecase.js';
import { UpdateCentroOrigemUseCase } from '../../application/usecases/centro-origem/update-centro-origem.usecase.js';
import { CENTRO_ORIGEM_REPOSITORY } from '../../domain/repositories/centro-origem/centro-origem.repository.js';
import { CreateCentroOrigemController } from '../../presentation/controllers/centro-origem/create-centro-origem.controller.js';
import { DeleteCentroOrigemController } from '../../presentation/controllers/centro-origem/delete-centro-origem.controller.js';
import { GetCentroOrigemController } from '../../presentation/controllers/centro-origem/get-centro-origem.controller.js';
import { ListCentrosOrigemController } from '../../presentation/controllers/centro-origem/list-centros-origem.controller.js';
import { UpdateCentroOrigemController } from '../../presentation/controllers/centro-origem/update-centro-origem.controller.js';
import { CentroOrigemService } from '../db/centro-origem/centro-origem.service.js';
import { AuthModule } from './auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [
    ListCentrosOrigemController,
    GetCentroOrigemController,
    CreateCentroOrigemController,
    UpdateCentroOrigemController,
    DeleteCentroOrigemController,
  ],
  providers: [
    ListCentrosOrigemUseCase,
    GetCentroOrigemUseCase,
    CreateCentroOrigemUseCase,
    UpdateCentroOrigemUseCase,
    DeleteCentroOrigemUseCase,
    {
      provide: CENTRO_ORIGEM_REPOSITORY,
      useClass: CentroOrigemService,
    },
  ],
  exports: [CENTRO_ORIGEM_REPOSITORY],
})
export class CentroOrigemModule {}
