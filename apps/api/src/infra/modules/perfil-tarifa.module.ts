import { Module } from '@nestjs/common';

import { CreatePerfilTarifaUseCase } from '../../application/usecases/perfil-tarifa/create-perfil-tarifa.usecase.js';
import { DeletePerfilTarifaUseCase } from '../../application/usecases/perfil-tarifa/delete-perfil-tarifa.usecase.js';
import { ListPerfisTarifasUseCase } from '../../application/usecases/perfil-tarifa/list-perfis-tarifas.usecase.js';
import { ListTiposVeiculoRavexUseCase } from '../../application/usecases/perfil-tarifa/list-tipos-veiculo-ravex.usecase.js';
import { UpdatePerfilTarifaUseCase } from '../../application/usecases/perfil-tarifa/update-perfil-tarifa.usecase.js';
import { UpsertFaixasKmUseCase } from '../../application/usecases/perfil-tarifa/upsert-faixas-km.usecase.js';
import { PERFIL_TARIFA_REPOSITORY } from '../../domain/repositories/perfil-tarifa/perfil-tarifa.repository.js';
import { PerfilTarifaService } from '../db/perfil-tarifa/perfil-tarifa.service.js';
import { CreatePerfilTarifaController } from '../../presentation/controllers/perfil-tarifa/create-perfil-tarifa.controller.js';
import { DeletePerfilTarifaController } from '../../presentation/controllers/perfil-tarifa/delete-perfil-tarifa.controller.js';
import { ListPerfisTarifasController } from '../../presentation/controllers/perfil-tarifa/list-perfis-tarifas.controller.js';
import { ListTiposVeiculoRavexController } from '../../presentation/controllers/perfil-tarifa/list-tipos-veiculo-ravex.controller.js';
import { UpdatePerfilTarifaController } from '../../presentation/controllers/perfil-tarifa/update-perfil-tarifa.controller.js';
import { UpsertFaixasKmController } from '../../presentation/controllers/perfil-tarifa/upsert-faixas-km.controller.js';
import { PermissionsGuard } from '../../shared/guards/permissions.guard.js';
import { AuthModule } from './auth.module.js';
import { RavexModule } from './ravex.module.js';
import { UnidadeModule } from './unidade.module.js';

@Module({
  imports: [AuthModule, UnidadeModule, RavexModule],
  controllers: [
    ListPerfisTarifasController,
    ListTiposVeiculoRavexController,
    CreatePerfilTarifaController,
    UpdatePerfilTarifaController,
    DeletePerfilTarifaController,
    UpsertFaixasKmController,
  ],
  providers: [
    ListPerfisTarifasUseCase,
    ListTiposVeiculoRavexUseCase,
    CreatePerfilTarifaUseCase,
    UpdatePerfilTarifaUseCase,
    DeletePerfilTarifaUseCase,
    UpsertFaixasKmUseCase,
    PermissionsGuard,
    {
      provide: PERFIL_TARIFA_REPOSITORY,
      useClass: PerfilTarifaService,
    },
  ],
  exports: [PERFIL_TARIFA_REPOSITORY],
})
export class PerfilTarifaModule {}
