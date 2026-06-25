import { Module } from '@nestjs/common';

import { BuscarTransportadoraPorPlacaUseCase } from '../../application/usecases/transportadora/buscar-transportadora-por-placa.usecase.js';
import { BuscarTransportadoraRavexUseCase } from '../../application/usecases/transportadora/buscar-transportadora-ravex.usecase.js';
import { CreateTransportadoraUseCase } from '../../application/usecases/transportadora/create-transportadora.usecase.js';
import { DeleteTransportadoraUseCase } from '../../application/usecases/transportadora/delete-transportadora.usecase.js';
import { ImportarTransportadoraRavexUseCase } from '../../application/usecases/transportadora/importar-transportadora-ravex.usecase.js';
import { ListTransportadorasUseCase } from '../../application/usecases/transportadora/list-transportadoras.usecase.js';
import { UpdateTransportadoraUseCase } from '../../application/usecases/transportadora/update-transportadora.usecase.js';
import { BuscarPlacasUnidadeUseCase } from '../../application/usecases/placa-transportadora/buscar-placas-unidade.usecase.js';
import { ListarPlacasUseCase } from '../../application/usecases/placa-transportadora/listar-placas.usecase.js';
import { ListarPlacasUnidadeUseCase } from '../../application/usecases/placa-transportadora/listar-placas-unidade.usecase.js';
import { SincronizarPlacasUseCase } from '../../application/usecases/placa-transportadora/sincronizar-placas.usecase.js';
import { AtualizarPerfilPlacaUseCase } from '../../application/usecases/placa-transportadora/atualizar-perfil-placa.usecase.js';
import { AtualizarPerfilPlacasMassaUseCase } from '../../application/usecases/placa-transportadora/atualizar-perfil-placas-massa.usecase.js';
import { PLACA_TRANSPORTADORA_REPOSITORY } from '../../domain/repositories/placa-transportadora/placa-transportadora.repository.js';
import { TRANSPORTADORA_REPOSITORY } from '../../domain/repositories/transportadora/transportadora.repository.js';
import { PlacaTransportadoraService } from '../db/placa-transportadora/placa-transportadora.service.js';
import { TransportadoraService } from '../db/transportadora/transportadora.service.js';
import { BuscarTransportadoraPorPlacaController } from '../../presentation/controllers/transportadora/buscar-transportadora-por-placa.controller.js';
import { BuscarTransportadoraRavexController } from '../../presentation/controllers/transportadora/buscar-transportadora-ravex.controller.js';
import { CreateTransportadoraController } from '../../presentation/controllers/transportadora/create-transportadora.controller.js';
import { DeleteTransportadoraController } from '../../presentation/controllers/transportadora/delete-transportadora.controller.js';
import { ImportarTransportadoraRavexController } from '../../presentation/controllers/transportadora/importar-transportadora-ravex.controller.js';
import { ListTransportadorasController } from '../../presentation/controllers/transportadora/list-transportadoras.controller.js';
import { UpdateTransportadoraController } from '../../presentation/controllers/transportadora/update-transportadora.controller.js';
import { BuscarPlacasUnidadeController } from '../../presentation/controllers/placa-transportadora/buscar-placas-unidade.controller.js';
import { ListarPlacasController } from '../../presentation/controllers/placa-transportadora/listar-placas.controller.js';
import { ListarPlacasUnidadeController } from '../../presentation/controllers/placa-transportadora/listar-placas-unidade.controller.js';
import { SincronizarPlacasController } from '../../presentation/controllers/placa-transportadora/sincronizar-placas.controller.js';
import { AtualizarPerfilPlacaController } from '../../presentation/controllers/placa-transportadora/atualizar-perfil-placa.controller.js';
import { AtualizarPerfilPlacasMassaController } from '../../presentation/controllers/placa-transportadora/atualizar-perfil-placas-massa.controller.js';
import { PermissionsGuard } from '../../shared/guards/permissions.guard.js';
import { AuthModule } from './auth.module.js';
import { PerfilTarifaModule } from './perfil-tarifa.module.js';
import { RavexModule } from './ravex.module.js';
import { UnidadeModule } from './unidade.module.js';

@Module({
  imports: [AuthModule, UnidadeModule, RavexModule, PerfilTarifaModule],
  controllers: [
    ListTransportadorasController,
    CreateTransportadoraController,
    UpdateTransportadoraController,
    DeleteTransportadoraController,
    ImportarTransportadoraRavexController,
    BuscarTransportadoraPorPlacaController,
    BuscarTransportadoraRavexController,
    ListarPlacasUnidadeController,
    BuscarPlacasUnidadeController,
    AtualizarPerfilPlacasMassaController,
    AtualizarPerfilPlacaController,
    ListarPlacasController,
    SincronizarPlacasController,
  ],
  providers: [
    ListTransportadorasUseCase,
    CreateTransportadoraUseCase,
    UpdateTransportadoraUseCase,
    DeleteTransportadoraUseCase,
    ImportarTransportadoraRavexUseCase,
    BuscarTransportadoraPorPlacaUseCase,
    BuscarTransportadoraRavexUseCase,
    ListarPlacasUseCase,
    ListarPlacasUnidadeUseCase,
    BuscarPlacasUnidadeUseCase,
    SincronizarPlacasUseCase,
    AtualizarPerfilPlacaUseCase,
    AtualizarPerfilPlacasMassaUseCase,
    PermissionsGuard,
    {
      provide: TRANSPORTADORA_REPOSITORY,
      useClass: TransportadoraService,
    },
    {
      provide: PLACA_TRANSPORTADORA_REPOSITORY,
      useClass: PlacaTransportadoraService,
    },
  ],
  exports: [TRANSPORTADORA_REPOSITORY, PLACA_TRANSPORTADORA_REPOSITORY],
})
export class TransportadoraModule {}
