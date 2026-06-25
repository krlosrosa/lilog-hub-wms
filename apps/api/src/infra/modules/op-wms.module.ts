import { Module } from '@nestjs/common';

import { AddFuncionarioDemandaCarregamentoUseCase } from '../../application/usecases/op-wms/add-funcionario-demanda-carregamento.usecase.js';
import { CriarDemandasSeparacaoUseCase } from '../../application/usecases/op-wms/criar-demandas-separacao.usecase.js';
import { FinalizarDemandaSeparacaoUseCase } from '../../application/usecases/op-wms/finalizar-demanda-separacao.usecase.js';
import { GetRecursosSessaoUseCase } from '../../application/usecases/op-wms/get-recursos-sessao.usecase.js';
import { ListMapasGrupoDisponiveisUseCase } from '../../application/usecases/op-wms/list-mapas-grupo-disponiveis.usecase.js';
import { RemoveFuncionarioDemandaCarregamentoUseCase } from '../../application/usecases/op-wms/remove-funcionario-demanda-carregamento.usecase.js';
import { ResumoMapasTransportesUseCase } from '../../application/usecases/op-wms/resumo-mapas-transportes.usecase.js';
import { CONFIGURACAO_OPERACIONAL_REPOSITORY } from '../../domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
import { DEMANDA_SEPARACAO_REPOSITORY } from '../../domain/repositories/op-wms/demanda-separacao.repository.js';
import { AddFuncionarioDemandaCarregamentoController } from '../../presentation/controllers/op-wms/add-funcionario-demanda-carregamento.controller.js';
import { CriarDemandasSeparacaoController } from '../../presentation/controllers/op-wms/criar-demandas-separacao.controller.js';
import { FinalizarDemandaSeparacaoController } from '../../presentation/controllers/op-wms/finalizar-demanda-separacao.controller.js';
import { GetRecursosSessaoController } from '../../presentation/controllers/op-wms/get-recursos-sessao.controller.js';
import { ListMapasGrupoDisponiveisController } from '../../presentation/controllers/op-wms/list-mapas-grupo-disponiveis.controller.js';
import { RemoveFuncionarioDemandaCarregamentoController } from '../../presentation/controllers/op-wms/remove-funcionario-demanda-carregamento.controller.js';
import { ResumoMapasTransportesController } from '../../presentation/controllers/op-wms/resumo-mapas-transportes.controller.js';
import { PermissionsGuard } from '../../shared/guards/permissions.guard.js';
import { ConfiguracaoOperacionalService } from '../db/configuracao-operacional/configuracao-operacional.service.js';
import { DemandaSeparacaoService } from '../db/op-wms/demanda-separacao.service.js';
import { AuthModule } from './auth.module.js';
import { SessaoOperacaoModule } from './sessao-operacao.module.js';
import { ExpedicaoTransporteQueueModule } from './expedicao-transporte-queue.module.js';

@Module({
  imports: [AuthModule, SessaoOperacaoModule, ExpedicaoTransporteQueueModule],
  controllers: [
    GetRecursosSessaoController,
    ListMapasGrupoDisponiveisController,
    ResumoMapasTransportesController,
    CriarDemandasSeparacaoController,
    FinalizarDemandaSeparacaoController,
    AddFuncionarioDemandaCarregamentoController,
    RemoveFuncionarioDemandaCarregamentoController,
  ],
  providers: [
    GetRecursosSessaoUseCase,
    ListMapasGrupoDisponiveisUseCase,
    ResumoMapasTransportesUseCase,
    CriarDemandasSeparacaoUseCase,
    FinalizarDemandaSeparacaoUseCase,
    AddFuncionarioDemandaCarregamentoUseCase,
    RemoveFuncionarioDemandaCarregamentoUseCase,
    PermissionsGuard,
    {
      provide: DEMANDA_SEPARACAO_REPOSITORY,
      useClass: DemandaSeparacaoService,
    },
    {
      provide: CONFIGURACAO_OPERACIONAL_REPOSITORY,
      useClass: ConfiguracaoOperacionalService,
    },
  ],
})
export class OpWmsModule {}
