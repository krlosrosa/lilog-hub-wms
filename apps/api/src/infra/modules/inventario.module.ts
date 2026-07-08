import { Module } from '@nestjs/common';

import {
  CreateDemandaContagemUseCase,
  DeleteDemandaContagemUseCase,
  ListDemandasContagemUseCase,
  ResolveDemandaEnderecosUseCase,
} from '../../application/usecases/inventario/demanda.usecases.js';
import {
  ListContagemDemandsUseCase,
  ListDemandaEnderecosUseCase,
  SubmitContagemAvariaUseCase,
  SubmitContagemCegaUseCase,
  SubmitContagemValidacaoUseCase,
} from '../../application/usecases/inventario/contagem.usecases.js';
import {
  AprovarDivergenciaInventarioUseCase,
  ListDivergenciasInventarioUseCase,
  ReprovarDivergenciaInventarioUseCase,
  SolicitarRecontagemDivergenciaUseCase,
} from '../../application/usecases/inventario/divergencia.usecases.js';
import {
  CreateInventarioUseCase,
  GetInventarioDetalheUseCase,
  GetInventarioKpiUseCase,
  GetInventarioTrendUseCase,
  IniciarInventarioUseCase,
  ListInventariosUseCase,
  UpdateInventarioStatusUseCase,
} from '../../application/usecases/inventario/inventario.usecases.js';
import { INVENTARIO_REPOSITORY } from '../../domain/repositories/inventario/inventario.repository.js';
import { InventarioService } from '../db/inventario/inventario.service.js';
import { ListContagemDemandsController } from '../../presentation/controllers/contagem/list-contagem-demands.controller.js';
import { ListDemandaEnderecosController } from '../../presentation/controllers/contagem/list-demanda-enderecos.controller.js';
import { SubmitContagemAvariaController } from '../../presentation/controllers/contagem/submit-contagem-avaria.controller.js';
import { SubmitContagemCegaController } from '../../presentation/controllers/contagem/submit-contagem-cega.controller.js';
import { SubmitContagemValidacaoController } from '../../presentation/controllers/contagem/submit-contagem-validacao.controller.js';
import { AprovarDivergenciaInventarioController } from '../../presentation/controllers/inventario/aprovar-divergencia-inventario.controller.js';
import { CreateDemandaController } from '../../presentation/controllers/inventario/create-demanda.controller.js';
import { CreateInventarioController } from '../../presentation/controllers/inventario/create-inventario.controller.js';
import { DeleteDemandaController } from '../../presentation/controllers/inventario/delete-demanda.controller.js';
import { GetInventarioController } from '../../presentation/controllers/inventario/get-inventario.controller.js';
import { GetInventarioTrendController } from '../../presentation/controllers/inventario/get-inventario-trend.controller.js';
import { IniciarInventarioController } from '../../presentation/controllers/inventario/iniciar-inventario.controller.js';
import { ListDemandasController } from '../../presentation/controllers/inventario/list-demandas.controller.js';
import { ListDivergenciasInventarioController } from '../../presentation/controllers/inventario/list-divergencias-inventario.controller.js';
import { ListInventariosController } from '../../presentation/controllers/inventario/list-inventarios.controller.js';
import { ReprovarDivergenciaInventarioController } from '../../presentation/controllers/inventario/reprovar-divergencia-inventario.controller.js';
import { SolicitarRecontagemDivergenciaInventarioController } from '../../presentation/controllers/inventario/solicitar-recontagem-divergencia-inventario.controller.js';
import { UpdateInventarioStatusController } from '../../presentation/controllers/inventario/update-inventario-status.controller.js';
import { AuthModule } from './auth.module.js';
import { EstoqueModule } from './estoque.module.js';
import { InventarioDivergenciaQueueModule } from './inventario-divergencia-queue.module.js';
import { ProdutoModule } from './produto.module.js';
import { PermissionsGuard } from '../../shared/guards/permissions.guard.js';

@Module({
  imports: [
    AuthModule,
    ProdutoModule,
    EstoqueModule,
    InventarioDivergenciaQueueModule,
  ],
  controllers: [
    ListInventariosController,
    GetInventarioTrendController,
    CreateInventarioController,
    GetInventarioController,
    UpdateInventarioStatusController,
    IniciarInventarioController,
    ListDemandasController,
    CreateDemandaController,
    DeleteDemandaController,
    ListDivergenciasInventarioController,
    AprovarDivergenciaInventarioController,
    ReprovarDivergenciaInventarioController,
    SolicitarRecontagemDivergenciaInventarioController,
    ListContagemDemandsController,
    ListDemandaEnderecosController,
    SubmitContagemCegaController,
    SubmitContagemValidacaoController,
    SubmitContagemAvariaController,
  ],
  providers: [
    CreateInventarioUseCase,
    ListInventariosUseCase,
    GetInventarioKpiUseCase,
    GetInventarioTrendUseCase,
    GetInventarioDetalheUseCase,
    UpdateInventarioStatusUseCase,
    IniciarInventarioUseCase,
    ListDivergenciasInventarioUseCase,
    AprovarDivergenciaInventarioUseCase,
    ReprovarDivergenciaInventarioUseCase,
    SolicitarRecontagemDivergenciaUseCase,
    CreateDemandaContagemUseCase,
    ListDemandasContagemUseCase,
    DeleteDemandaContagemUseCase,
    ResolveDemandaEnderecosUseCase,
    ListContagemDemandsUseCase,
    ListDemandaEnderecosUseCase,
    SubmitContagemCegaUseCase,
    SubmitContagemValidacaoUseCase,
    SubmitContagemAvariaUseCase,
    PermissionsGuard,
    {
      provide: INVENTARIO_REPOSITORY,
      useClass: InventarioService,
    },
  ],
})
export class InventarioModule {}
