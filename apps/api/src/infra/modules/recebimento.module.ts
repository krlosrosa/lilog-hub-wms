import { Module } from '@nestjs/common';

import { RecebimentoEventPublisher } from '../../application/services/recebimento-event.publisher.js';
import { RecebimentoParticipacaoService } from '../../application/services/recebimento/recebimento-participacao.service.js';
import { CancelPreRecebimentoUseCase } from '../../application/usecases/recebimento/cancel-pre-recebimento.usecase.js';
import { LiberarConferenciaUseCase } from '../../application/usecases/recebimento/liberar-conferencia.usecase.js';
import { RecepcionarCarroUseCase } from '../../application/usecases/recebimento/recepcionar-carro.usecase.js';
import { ConferirItemUseCase } from '../../application/usecases/recebimento/conferir-item.usecase.js';
import { RemoverConferenciaItemUseCase } from '../../application/usecases/recebimento/remover-conferencia-item.usecase.js';
import { RemoverLinhaConferenciaRecebimentoUseCase } from '../../application/usecases/recebimento/remover-linha-conferencia-recebimento.usecase.js';
import { RemovePesagemRecebimentoUseCase } from '../../application/usecases/recebimento/remove-pesagem-recebimento.usecase.js';
import { RemoverPaleteConferenciaRecebimentoUseCase } from '../../application/usecases/recebimento/remover-palete-conferencia-recebimento.usecase.js';
import { CreateChecklistRecebimentoUseCase } from '../../application/usecases/recebimento/create-checklist-recebimento.usecase.js';
import { GetChecklistRecebimentoUseCase } from '../../application/usecases/recebimento/get-checklist-recebimento.usecase.js';
import { ListTemperaturasProdutoRecebimentoUseCase } from '../../application/usecases/recebimento/list-temperaturas-produto-recebimento.usecase.js';
import { UpsertTemperaturaProdutoRecebimentoUseCase } from '../../application/usecases/recebimento/upsert-temperatura-produto-recebimento.usecase.js';
import { CreatePreRecebimentoUseCase } from '../../application/usecases/recebimento/create-pre-recebimento.usecase.js';
import { EncerrarConferenciaUseCase } from '../../application/usecases/recebimento/encerrar-conferencia.usecase.js';
import { ReabrirConferenciaUseCase } from '../../application/usecases/recebimento/reabrir-conferencia.usecase.js';
import { FinalizarRecebimentoUseCase } from '../../application/usecases/recebimento/finalizar-recebimento.usecase.js';
import { GetConferenciaContextUseCase } from '../../application/usecases/recebimento/get-conferencia-context.usecase.js';
import { GetPreRecebimentoUseCase } from '../../application/usecases/recebimento/get-pre-recebimento.usecase.js';
import { GetPreRecebimentoDetalheUseCase } from '../../application/usecases/recebimento/get-pre-recebimento-detalhe.usecase.js';
import { ListOperadorDemandasUseCase } from '../../application/usecases/recebimento/list-operador-demandas.usecase.js';
import { ListRecebimentoAvariasUseCase } from '../../application/usecases/recebimento/list-recebimento-avarias.usecase.js';
import { RegistrarAvariaUseCase } from '../../application/usecases/recebimento/registrar-avaria.usecase.js';
import { RemoverAvariasRecebimentoUseCase } from '../../application/usecases/recebimento/remover-avarias-recebimento.usecase.js';
import { RemoverAvariaRecebimentoUseCase } from '../../application/usecases/recebimento/remover-avaria-recebimento.usecase.js';
import { GetRecebimentoByPreRecebimentoUseCase } from '../../application/usecases/recebimento/get-recebimento-by-pre-recebimento.usecase.js';
import { GetRecebimentoUseCase } from '../../application/usecases/recebimento/get-recebimento.usecase.js';
import { IniciarRecebimentoUseCase } from '../../application/usecases/recebimento/iniciar-recebimento.usecase.js';
import { ListPreRecebimentosUseCase } from '../../application/usecases/recebimento/list-pre-recebimentos.usecase.js';
import { ListRecebimentosUseCase } from '../../application/usecases/recebimento/list-recebimentos.usecase.js';
import { UpdatePreRecebimentoUseCase } from '../../application/usecases/recebimento/update-pre-recebimento.usecase.js';
import {
  GerarLinkRastreioUseCase,
  GetRastreioStatusUseCase,
} from '../../application/usecases/recebimento/gerar-link-rastreio.usecase.js';
import { CriarAlocacaoRecebimentoUseCase } from '../../application/usecases/recebimento/criar-alocacao-recebimento.usecase.js';
import { CancelarAlocacaoRecebimentoUseCase } from '../../application/usecases/recebimento/cancelar-alocacao-recebimento.usecase.js';
import { AdicionarApoioRecebimentoUseCase } from '../../application/usecases/recebimento/adicionar-apoio-recebimento.usecase.js';
import { RemoverApoioRecebimentoUseCase } from '../../application/usecases/recebimento/remover-apoio-recebimento.usecase.js';
import { EncerrarApoioRecebimentoUseCase } from '../../application/usecases/recebimento/encerrar-apoio-recebimento.usecase.js';
import { GetRecursosRecebimentoSessaoUseCase } from '../../application/usecases/recebimento/get-recursos-recebimento-sessao.usecase.js';
import { GetRecebimentoPainelSnapshotUseCase } from '../../application/usecases/recebimento/get-recebimento-painel-snapshot.usecase.js';
import { GetRelatorioItensConferidosUseCase } from '../../application/usecases/recebimento/get-relatorio-itens-conferidos.usecase.js';
import { RegistrarImpedimentoRecebimentoUseCase } from '../../application/usecases/recebimento/registrar-impedimento-recebimento.usecase.js';
import { RetomarConferenciaImpedidaUseCase } from '../../application/usecases/recebimento/retomar-conferencia-impedida.usecase.js';
import { CONFERENCIA_REPOSITORY } from '../../domain/repositories/recebimento/conferencia.repository.js';
import { PRE_RECEBIMENTO_REPOSITORY } from '../../domain/repositories/recebimento/pre-recebimento.repository.js';
import { RECEBIMENTO_AVARIA_REPOSITORY } from '../../domain/repositories/recebimento/recebimento-avaria.repository.js';
import { RECEBIMENTO_REPOSITORY } from '../../domain/repositories/recebimento/recebimento.repository.js';
import { RECEBIMENTO_ALOCACAO_REPOSITORY } from '../../domain/repositories/recebimento/recebimento-alocacao.repository.js';
import { RECEBIMENTO_PAINEL_REPOSITORY } from '../../domain/repositories/recebimento/recebimento-painel.repository.js';
import { IMPEDIMENTO_REPOSITORY } from '../../domain/repositories/recebimento/impedimento.repository.js';

import { CancelPreRecebimentoController } from '../../presentation/controllers/recebimento/cancel-pre-recebimento.controller.js';
import { LiberarConferenciaController } from '../../presentation/controllers/recebimento/liberar-conferencia.controller.js';
import { RetomarConferenciaImpedidaController } from '../../presentation/controllers/recebimento/retomar-conferencia-impedida.controller.js';
import { RecepcionarCarroController } from '../../presentation/controllers/recebimento/recepcionar-carro.controller.js';
import { ConferirItemController } from '../../presentation/controllers/recebimento/conferir-item.controller.js';
import { RemoverConferenciaItemController } from '../../presentation/controllers/recebimento/remover-conferencia-item.controller.js';
import { RemoverLinhaConferenciaRecebimentoController } from '../../presentation/controllers/recebimento/remover-linha-conferencia-recebimento.controller.js';
import { RemovePesagemRecebimentoController } from '../../presentation/controllers/recebimento/remove-pesagem-recebimento.controller.js';
import { RemoverPaleteConferenciaRecebimentoController } from '../../presentation/controllers/recebimento/remover-palete-conferencia-recebimento.controller.js';
import { CreateChecklistRecebimentoController } from '../../presentation/controllers/recebimento/create-checklist-recebimento.controller.js';
import { GetChecklistRecebimentoController } from '../../presentation/controllers/recebimento/get-checklist-recebimento.controller.js';
import { ListTemperaturasProdutoRecebimentoController } from '../../presentation/controllers/recebimento/list-temperaturas-produto-recebimento.controller.js';
import { UpsertTemperaturaProdutoRecebimentoController } from '../../presentation/controllers/recebimento/upsert-temperatura-produto-recebimento.controller.js';
import { CreatePreRecebimentoController } from '../../presentation/controllers/recebimento/create-pre-recebimento.controller.js';
import { EncerrarConferenciaController } from '../../presentation/controllers/recebimento/encerrar-conferencia.controller.js';
import { ReabrirConferenciaController } from '../../presentation/controllers/recebimento/reabrir-conferencia.controller.js';
import { FinalizarRecebimentoController } from '../../presentation/controllers/recebimento/finalizar-recebimento.controller.js';
import { GetConferenciaContextController } from '../../presentation/controllers/recebimento/get-conferencia-context.controller.js';
import { GetPreRecebimentoController } from '../../presentation/controllers/recebimento/get-pre-recebimento.controller.js';
import { GetPreRecebimentoDetalheController } from '../../presentation/controllers/recebimento/get-pre-recebimento-detalhe.controller.js';
import { ListOperadorDemandasController } from '../../presentation/controllers/recebimento/list-operador-demandas.controller.js';
import { ListRecebimentoAvariasController } from '../../presentation/controllers/recebimento/list-recebimento-avarias.controller.js';
import { RegistrarAvariaController } from '../../presentation/controllers/recebimento/registrar-avaria.controller.js';
import { RemoverAvariasRecebimentoController } from '../../presentation/controllers/recebimento/remover-avarias-recebimento.controller.js';
import { RemoverAvariaRecebimentoController } from '../../presentation/controllers/recebimento/remover-avaria-recebimento.controller.js';
import { GetRecebimentoByPreRecebimentoController } from '../../presentation/controllers/recebimento/get-recebimento-by-pre-recebimento.controller.js';
import { GetRecebimentoController } from '../../presentation/controllers/recebimento/get-recebimento.controller.js';
import { IniciarRecebimentoController } from '../../presentation/controllers/recebimento/iniciar-recebimento.controller.js';
import { ListPreRecebimentosController } from '../../presentation/controllers/recebimento/list-pre-recebimentos.controller.js';
import { ListRecebimentosController } from '../../presentation/controllers/recebimento/list-recebimentos.controller.js';
import { UpdatePreRecebimentoController } from '../../presentation/controllers/recebimento/update-pre-recebimento.controller.js';
import { GerarLinkRastreioController } from '../../presentation/controllers/recebimento/gerar-link-rastreio.controller.js';
import { GetRastreioStatusController } from '../../presentation/controllers/recebimento/get-rastreio-status.controller.js';
import { CriarAlocacaoRecebimentoController } from '../../presentation/controllers/recebimento/criar-alocacao-recebimento.controller.js';
import { CancelarAlocacaoRecebimentoController } from '../../presentation/controllers/recebimento/cancelar-alocacao-recebimento.controller.js';
import {
  AdicionarApoioRecebimentoController,
  EncerrarApoioRecebimentoController,
  RemoverApoioRecebimentoController,
} from '../../presentation/controllers/recebimento/adicionar-apoio-recebimento.controller.js';
import { GetRecursosRecebimentoSessaoController } from '../../presentation/controllers/recebimento/get-recursos-recebimento-sessao.controller.js';
import { GetRecebimentoPainelSnapshotController } from '../../presentation/controllers/recebimento/get-recebimento-painel-snapshot.controller.js';
import { GetRelatorioItensConferidosController } from '../../presentation/controllers/recebimento/get-relatorio-itens-conferidos.controller.js';
import { PermissionsGuard } from '../../shared/guards/permissions.guard.js';
import { GerarPdfDeHtmlService } from '../pdf/gerar-pdf-de-html.service.js';
import { ConferenciaService } from '../db/recebimento/conferencia.service.js';
import { PreRecebimentoService } from '../db/recebimento/pre-recebimento.service.js';
import { RecebimentoAvariaService } from '../db/recebimento/recebimento-avaria.service.js';
import { RecebimentoService } from '../db/recebimento/recebimento.service.js';
import { RecebimentoAlocacaoService } from '../db/recebimento/recebimento-alocacao.service.js';
import { RecebimentoPainelService } from '../db/recebimento/recebimento-painel.service.js';
import { ImpedimentoService } from '../db/recebimento/impedimento.service.js';
import { AuditLogModule } from './audit-log.module.js';
import { AuthModule } from './auth.module.js';
import { CncModule } from './cnc.module.js';
import { DocaModule } from './doca.module.js';
import { FuncionarioModule } from './funcionario.module.js';
import { OperacionalModule } from './operacional.module.js';
import { ProdutoModule } from './produto.module.js';
import { UnidadeModule } from './unidade.module.js';
import { UserModule } from './user.module.js';
import { SessaoOperacaoModule } from './sessao-operacao.module.js';
import { DocumentoModule } from './documento.module.js';

@Module({
  imports: [
    AuthModule,
    AuditLogModule,
    UnidadeModule,
    ProdutoModule,
    DocaModule,
    FuncionarioModule,
    CncModule,
    OperacionalModule,
    UserModule,
    SessaoOperacaoModule,
    DocumentoModule,
  ],
  controllers: [
    ListOperadorDemandasController,
    ListRecebimentoAvariasController,
    ListPreRecebimentosController,
    GetConferenciaContextController,
    GetRecebimentoByPreRecebimentoController,
    GetPreRecebimentoController,
    GetPreRecebimentoDetalheController,
    ListRecebimentosController,
    CreatePreRecebimentoController,
    UpdatePreRecebimentoController,
    CancelPreRecebimentoController,
    LiberarConferenciaController,
    RetomarConferenciaImpedidaController,
    RecepcionarCarroController,
    IniciarRecebimentoController,
    ConferirItemController,
    RemoverConferenciaItemController,
    RemoverLinhaConferenciaRecebimentoController,
    RemovePesagemRecebimentoController,
    RemoverPaleteConferenciaRecebimentoController,
    CreateChecklistRecebimentoController,
    GetChecklistRecebimentoController,
    ListTemperaturasProdutoRecebimentoController,
    UpsertTemperaturaProdutoRecebimentoController,
    EncerrarConferenciaController,
    ReabrirConferenciaController,
    FinalizarRecebimentoController,
    GetRecebimentoController,
    RegistrarAvariaController,
    RemoverAvariasRecebimentoController,
    RemoverAvariaRecebimentoController,
    GerarLinkRastreioController,
    GetRastreioStatusController,
    CriarAlocacaoRecebimentoController,
    CancelarAlocacaoRecebimentoController,
    AdicionarApoioRecebimentoController,
    RemoverApoioRecebimentoController,
    EncerrarApoioRecebimentoController,
    GetRecursosRecebimentoSessaoController,
    GetRecebimentoPainelSnapshotController,
    GetRelatorioItensConferidosController,
  ],
  exports: [
    IniciarRecebimentoUseCase,
    CreateChecklistRecebimentoUseCase,
    UpsertTemperaturaProdutoRecebimentoUseCase,
    ConferirItemUseCase,
    ListOperadorDemandasUseCase,
    GetConferenciaContextUseCase,
    RemoverConferenciaItemUseCase,
    RemoverLinhaConferenciaRecebimentoUseCase,
    RemoverPaleteConferenciaRecebimentoUseCase,
    RemovePesagemRecebimentoUseCase,
    RegistrarAvariaUseCase,
    RemoverAvariasRecebimentoUseCase,
    RemoverAvariaRecebimentoUseCase,
    EncerrarConferenciaUseCase,
    RegistrarImpedimentoRecebimentoUseCase,
    RetomarConferenciaImpedidaUseCase,
    RecebimentoParticipacaoService,
    PRE_RECEBIMENTO_REPOSITORY,
    RECEBIMENTO_REPOSITORY,
    CONFERENCIA_REPOSITORY,
    RECEBIMENTO_AVARIA_REPOSITORY,
    RECEBIMENTO_ALOCACAO_REPOSITORY,
  ],
  providers: [
    CreatePreRecebimentoUseCase,
    UpdatePreRecebimentoUseCase,
    CancelPreRecebimentoUseCase,
    LiberarConferenciaUseCase,
    RecepcionarCarroUseCase,
    IniciarRecebimentoUseCase,
    ConferirItemUseCase,
    RemoverConferenciaItemUseCase,
    RemoverLinhaConferenciaRecebimentoUseCase,
    RemovePesagemRecebimentoUseCase,
    RemoverPaleteConferenciaRecebimentoUseCase,
    CreateChecklistRecebimentoUseCase,
    GetChecklistRecebimentoUseCase,
    ListTemperaturasProdutoRecebimentoUseCase,
    UpsertTemperaturaProdutoRecebimentoUseCase,
    EncerrarConferenciaUseCase,
    ReabrirConferenciaUseCase,
    FinalizarRecebimentoUseCase,
    ListPreRecebimentosUseCase,
    ListRecebimentosUseCase,
    GetPreRecebimentoUseCase,
    GetPreRecebimentoDetalheUseCase,
    GetRecebimentoByPreRecebimentoUseCase,
    GetRecebimentoUseCase,
    ListOperadorDemandasUseCase,
    GetConferenciaContextUseCase,
    RegistrarAvariaUseCase,
    RemoverAvariasRecebimentoUseCase,
    RemoverAvariaRecebimentoUseCase,
    ListRecebimentoAvariasUseCase,
    GerarLinkRastreioUseCase,
    GetRastreioStatusUseCase,
    CriarAlocacaoRecebimentoUseCase,
    CancelarAlocacaoRecebimentoUseCase,
    AdicionarApoioRecebimentoUseCase,
    RemoverApoioRecebimentoUseCase,
    EncerrarApoioRecebimentoUseCase,
    GetRecursosRecebimentoSessaoUseCase,
    GetRecebimentoPainelSnapshotUseCase,
    GetRelatorioItensConferidosUseCase,
    RegistrarImpedimentoRecebimentoUseCase,
    RetomarConferenciaImpedidaUseCase,
    RecebimentoEventPublisher,
    RecebimentoParticipacaoService,
    GerarPdfDeHtmlService,
    PermissionsGuard,
    {
      provide: PRE_RECEBIMENTO_REPOSITORY,
      useClass: PreRecebimentoService,
    },
    {
      provide: RECEBIMENTO_REPOSITORY,
      useClass: RecebimentoService,
    },
    {
      provide: CONFERENCIA_REPOSITORY,
      useClass: ConferenciaService,
    },
    {
      provide: RECEBIMENTO_AVARIA_REPOSITORY,
      useClass: RecebimentoAvariaService,
    },
    {
      provide: RECEBIMENTO_ALOCACAO_REPOSITORY,
      useClass: RecebimentoAlocacaoService,
    },
    {
      provide: RECEBIMENTO_PAINEL_REPOSITORY,
      useClass: RecebimentoPainelService,
    },
    {
      provide: IMPEDIMENTO_REPOSITORY,
      useClass: ImpedimentoService,
    },
  ],
})
export class RecebimentoModule {}
