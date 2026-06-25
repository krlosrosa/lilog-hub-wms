import { Module } from '@nestjs/common';

import { BuscarMapaGrupoPorCodigoUseCase } from '../../application/usecases/corte-operacional/buscar-mapa-grupo-por-codigo.usecase.js';
import { CancelarCorteUseCase } from '../../application/usecases/corte-operacional/cancelar-corte.usecase.js';
import { GetCorteUseCase } from '../../application/usecases/corte-operacional/get-corte.usecase.js';
import { IniciarCorteUseCase } from '../../application/usecases/corte-operacional/iniciar-corte.usecase.js';
import { ListCortesUseCase } from '../../application/usecases/corte-operacional/list-cortes.usecase.js';
import { RealizarCorteUseCase } from '../../application/usecases/corte-operacional/realizar-corte.usecase.js';
import { SolicitarCorteUseCase } from '../../application/usecases/corte-operacional/solicitar-corte.usecase.js';
import { CORTE_OPERACIONAL_REPOSITORY } from '../../domain/repositories/corte-operacional/corte-operacional.repository.js';
import { BuscarMapaGrupoPorCodigoController } from '../../presentation/controllers/corte-operacional/buscar-mapa-grupo-por-codigo.controller.js';
import { CortesOperacionaisController } from '../../presentation/controllers/corte-operacional/cortes-operacionais.controller.js';
import { PermissionsGuard } from '../../shared/guards/permissions.guard.js';
import { CorteOperacionalService } from '../db/corte-operacional/corte-operacional.service.js';
import { AuthModule } from './auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [
    BuscarMapaGrupoPorCodigoController,
    CortesOperacionaisController,
  ],
  providers: [
    BuscarMapaGrupoPorCodigoUseCase,
    SolicitarCorteUseCase,
    ListCortesUseCase,
    GetCorteUseCase,
    IniciarCorteUseCase,
    RealizarCorteUseCase,
    CancelarCorteUseCase,
    PermissionsGuard,
    {
      provide: CORTE_OPERACIONAL_REPOSITORY,
      useClass: CorteOperacionalService,
    },
  ],
})
export class CorteOperacionalModule {}
