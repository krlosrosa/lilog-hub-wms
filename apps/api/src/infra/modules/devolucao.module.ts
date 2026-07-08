import { Module } from '@nestjs/common';

import { AtualizarStatusDemandaDevolucaoUseCase } from '../../application/usecases/devolucao/atualizar-status-demanda-devolucao.usecase.js';
import { BuscarDemandaDevolucaoUseCase } from '../../application/usecases/devolucao/buscar-demanda-devolucao.usecase.js';
import { CriarAlocacaoDevolucaoUseCase } from '../../application/usecases/devolucao/criar-alocacao-devolucao.usecase.js';
import { DeletarDemandaDevolucaoUseCase } from '../../application/usecases/devolucao/deletar-demanda-devolucao.usecase.js';
import { GerarDemandaDevolucaoViagemUseCase } from '../../application/usecases/devolucao/gerar-demanda-devolucao-viagem.usecase.js';
import { GetRecursosDevolucaoSessaoUseCase } from '../../application/usecases/devolucao/get-recursos-devolucao-sessao.usecase.js';
import { IncluirDemandaDevolucaoManualUseCase } from '../../application/usecases/devolucao/incluir-demanda-devolucao-manual.usecase.js';
import { ListarAvariasDemandaUseCase } from '../../application/usecases/devolucao/listar-avarias-demanda.usecase.js';
import { ListarFaltasPesoDevolucaoUseCase } from '../../application/usecases/devolucao/listar-faltas-peso-devolucao.usecase.js';
import { ListarDemandasDevolucaoUseCase } from '../../application/usecases/devolucao/listar-demandas-devolucao.usecase.js';
import { RegistrarAvariaDevolucaoUseCase } from '../../application/usecases/devolucao/registrar-avaria-devolucao.usecase.js';
import { RegistrarConferenciaItensUseCase } from '../../application/usecases/devolucao/registrar-conferencia-itens.usecase.js';
import { RegistrarFaltaPesoDevolucaoUseCase } from '../../application/usecases/devolucao/registrar-falta-peso-devolucao.usecase.js';
import { RemoverAlocacaoDevolucaoUseCase } from '../../application/usecases/devolucao/remover-alocacao-devolucao.usecase.js';
import { SalvarChecklistDevolucaoUseCase } from '../../application/usecases/devolucao/salvar-checklist-devolucao.usecase.js';
import { AtualizarFaltaPesoDevolucaoUseCase } from '../../application/usecases/devolucao/atualizar-falta-peso-devolucao.usecase.js';
import { AtualizarStatusGrupoDescargaDevolucaoUseCase } from '../../application/usecases/devolucao/atualizar-status-grupo-descarga-devolucao.usecase.js';
import { BuscarGrupoDescargaDevolucaoUseCase } from '../../application/usecases/devolucao/buscar-grupo-descarga-devolucao.usecase.js';
import { CriarGrupoDescargaDevolucaoUseCase } from '../../application/usecases/devolucao/criar-grupo-descarga-devolucao.usecase.js';
import { ListarGruposDescargaDevolucaoUseCase } from '../../application/usecases/devolucao/listar-grupos-descarga-devolucao.usecase.js';
import { RegistrarConferenciaGrupoDevolucaoUseCase } from '../../application/usecases/devolucao/registrar-conferencia-grupo-devolucao.usecase.js';
import { ValidarFaltaPesoDevolucaoUseCase } from '../../application/usecases/devolucao/validar-falta-peso-devolucao.usecase.js';
import { DEVOLUCAO_REPOSITORY } from '../../domain/repositories/devolucao/devolucao.repository.js';
import { AtualizarStatusDemandaDevolucaoController } from '../../presentation/controllers/devolucao/atualizar-status-demanda-devolucao.controller.js';
import { BuscarDemandaDevolucaoController } from '../../presentation/controllers/devolucao/buscar-demanda-devolucao.controller.js';
import { CriarAlocacaoDevolucaoController } from '../../presentation/controllers/devolucao/criar-alocacao-devolucao.controller.js';
import { DeletarDemandaDevolucaoController } from '../../presentation/controllers/devolucao/deletar-demanda-devolucao.controller.js';
import { GetRecursosDevolucaoSessaoController } from '../../presentation/controllers/devolucao/get-recursos-devolucao-sessao.controller.js';
import { IncluirDemandaDevolucaoManualController } from '../../presentation/controllers/devolucao/incluir-demanda-devolucao-manual.controller.js';
import { ListarAvariasDemandaDevolucaoController } from '../../presentation/controllers/devolucao/listar-avarias-demanda-devolucao.controller.js';
import { ListarFaltasPesoDevolucaoController } from '../../presentation/controllers/devolucao/listar-faltas-peso-devolucao.controller.js';
import { ListarDemandasDevolucaoController } from '../../presentation/controllers/devolucao/listar-demandas-devolucao.controller.js';
import { RegistrarAvariaDevolucaoController } from '../../presentation/controllers/devolucao/registrar-avaria-devolucao.controller.js';
import { RegistrarConferenciaItensController } from '../../presentation/controllers/devolucao/registrar-conferencia-itens.controller.js';
import { RegistrarFaltaPesoDevolucaoController } from '../../presentation/controllers/devolucao/registrar-falta-peso-devolucao.controller.js';
import { RemoverAlocacaoDevolucaoController } from '../../presentation/controllers/devolucao/remover-alocacao-devolucao.controller.js';
import { SalvarChecklistDevolucaoController } from '../../presentation/controllers/devolucao/salvar-checklist-devolucao.controller.js';
import { AtualizarFaltaPesoDevolucaoController } from '../../presentation/controllers/devolucao/atualizar-falta-peso-devolucao.controller.js';
import { ValidarFaltaPesoDevolucaoController } from '../../presentation/controllers/devolucao/validar-falta-peso-devolucao.controller.js';
import {
  AtualizarStatusGrupoDescargaDevolucaoController,
  BuscarGrupoDescargaDevolucaoController,
  CriarGrupoDescargaDevolucaoController,
  ListarGruposDescargaDevolucaoController,
  RegistrarConferenciaGrupoDevolucaoController,
} from '../../presentation/controllers/devolucao/grupo-descarga-devolucao.controller.js';
import { PermissionsGuard } from '../../shared/guards/permissions.guard.js';
import { DevolucaoService } from '../db/devolucao/devolucao.service.js';
import { AuthModule } from './auth.module.js';
import { ExpedicaoCoreModule } from './expedicao-core.module.js';
import { OperacionalModule } from './operacional.module.js';
import { CobrancaTransportadoraQueueModule } from './cobranca-transportadora-queue.module.js';
import { NotificacaoDevolucaoQueueModule } from './notificacao-devolucao-queue.module.js';
import { DocumentoModule } from './documento.module.js';
import { ProdutoModule } from './produto.module.js';
import { RavexModule } from './ravex.module.js';
import { SessaoOperacaoModule } from './sessao-operacao.module.js';

@Module({
  imports: [
    AuthModule,
    RavexModule,
    ExpedicaoCoreModule,
    ProdutoModule,
    SessaoOperacaoModule,
    OperacionalModule,
    DocumentoModule,
    CobrancaTransportadoraQueueModule,
    NotificacaoDevolucaoQueueModule,
  ],
  controllers: [
    ListarDemandasDevolucaoController,
    BuscarDemandaDevolucaoController,
    AtualizarStatusDemandaDevolucaoController,
    DeletarDemandaDevolucaoController,
    IncluirDemandaDevolucaoManualController,
    GetRecursosDevolucaoSessaoController,
    CriarAlocacaoDevolucaoController,
    RemoverAlocacaoDevolucaoController,
    RegistrarConferenciaItensController,
    RegistrarAvariaDevolucaoController,
    ListarAvariasDemandaDevolucaoController,
    SalvarChecklistDevolucaoController,
    RegistrarFaltaPesoDevolucaoController,
    AtualizarFaltaPesoDevolucaoController,
    ValidarFaltaPesoDevolucaoController,
    ListarFaltasPesoDevolucaoController,
    CriarGrupoDescargaDevolucaoController,
    ListarGruposDescargaDevolucaoController,
    BuscarGrupoDescargaDevolucaoController,
    AtualizarStatusGrupoDescargaDevolucaoController,
    RegistrarConferenciaGrupoDevolucaoController,
  ],
  providers: [
    ListarDemandasDevolucaoUseCase,
    BuscarDemandaDevolucaoUseCase,
    AtualizarStatusDemandaDevolucaoUseCase,
    DeletarDemandaDevolucaoUseCase,
    GerarDemandaDevolucaoViagemUseCase,
    IncluirDemandaDevolucaoManualUseCase,
    GetRecursosDevolucaoSessaoUseCase,
    CriarAlocacaoDevolucaoUseCase,
    RemoverAlocacaoDevolucaoUseCase,
    RegistrarConferenciaItensUseCase,
    RegistrarAvariaDevolucaoUseCase,
    ListarAvariasDemandaUseCase,
    SalvarChecklistDevolucaoUseCase,
    RegistrarFaltaPesoDevolucaoUseCase,
    AtualizarFaltaPesoDevolucaoUseCase,
    ValidarFaltaPesoDevolucaoUseCase,
    ListarFaltasPesoDevolucaoUseCase,
    CriarGrupoDescargaDevolucaoUseCase,
    ListarGruposDescargaDevolucaoUseCase,
    BuscarGrupoDescargaDevolucaoUseCase,
    AtualizarStatusGrupoDescargaDevolucaoUseCase,
    RegistrarConferenciaGrupoDevolucaoUseCase,
    PermissionsGuard,
    {
      provide: DEVOLUCAO_REPOSITORY,
      useClass: DevolucaoService,
    },
  ],
  exports: [DEVOLUCAO_REPOSITORY],
})
export class DevolucaoModule {}
