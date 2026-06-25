import { Module } from '@nestjs/common';

import { AtualizarClienteEspecialUseCase } from '../../application/usecases/expedicao/atualizar-cliente-especial.usecase.js';
import { AtualizarPrioridadeTransporteUseCase } from '../../application/usecases/expedicao/atualizar-prioridade-transporte.usecase.js';
import { AtualizarDadosCarregamentoTransporteUseCase } from '../../application/usecases/expedicao/atualizar-dados-carregamento-transporte.usecase.js';
import { CriarClienteEspecialUseCase } from '../../application/usecases/expedicao/criar-cliente-especial.usecase.js';
import { CriarUploadLoteUseCase } from '../../application/usecases/expedicao/criar-upload-lote.usecase.js';
import { DeletarClienteEspecialUseCase } from '../../application/usecases/expedicao/deletar-cliente-especial.usecase.js';
import { ExcluirMapaLoteUseCase } from '../../application/usecases/expedicao/excluir-mapa-lote.usecase.js';
import { ExcluirTransporteUseCase } from '../../application/usecases/expedicao/excluir-transporte.usecase.js';
import { GerarMapasUseCase } from '../../application/usecases/expedicao/gerar-mapas.usecase.js';
import { ImprimirMapasUseCase } from '../../application/usecases/expedicao/imprimir-mapas.usecase.js';
import { ListarClientesEspeciaisUseCase } from '../../application/usecases/expedicao/listar-clientes-especiais.usecase.js';
import { ListarMapasLotesUseCase } from '../../application/usecases/expedicao/listar-mapas-lotes.usecase.js';
import { ListarTransportesUseCase } from '../../application/usecases/expedicao/listar-transportes.usecase.js';
import { ObterClienteEspecialUseCase } from '../../application/usecases/expedicao/obter-cliente-especial.usecase.js';
import { ObterTorreControleExpedicaoUseCase } from '../../application/usecases/expedicao/obter-torre-controle-expedicao.usecase.js';
import { ObterMapaLoteUseCase } from '../../application/usecases/expedicao/obter-mapa-lote.usecase.js';
import { SalvarAlocacoesTransportesUseCase } from '../../application/usecases/expedicao/salvar-alocacoes-transportes.usecase.js';
import { SalvarMapasUseCase } from '../../application/usecases/expedicao/salvar-mapas.usecase.js';
import { AtualizarConfiguracaoImpressaoUseCase } from '../../application/usecases/configuracao-impressao/atualizar-configuracao-impressao.usecase.js';
import { CriarConfiguracaoImpressaoUseCase } from '../../application/usecases/configuracao-impressao/criar-configuracao-impressao.usecase.js';
import { DeletarConfiguracaoImpressaoUseCase } from '../../application/usecases/configuracao-impressao/deletar-configuracao-impressao.usecase.js';
import { DefinirPadraoConfiguracaoImpressaoUseCase } from '../../application/usecases/configuracao-impressao/definir-padrao-configuracao-impressao.usecase.js';
import { ListarConfiguracoesImpressaoUseCase } from '../../application/usecases/configuracao-impressao/listar-configuracoes-impressao.usecase.js';
import { CLIENTE_ESPECIAL_REPOSITORY } from '../../domain/repositories/expedicao/cliente-especial.repository.js';
import { CONFIGURACAO_IMPRESSAO_REPOSITORY } from '../../domain/repositories/configuracao-impressao/configuracao-impressao.repository.js';
import { MAPA_LOTE_REPOSITORY } from '../../domain/repositories/expedicao/mapa-lote.repository.js';
import { TORRE_CONTROLE_REPOSITORY } from '../../domain/repositories/expedicao/torre-controle.repository.js';
import { UPLOAD_LOTE_REPOSITORY } from '../../domain/repositories/expedicao/upload-lote.repository.js';
import { AtualizarConfiguracaoImpressaoController } from '../../presentation/controllers/configuracao-impressao/atualizar-configuracao-impressao.controller.js';
import { CriarConfiguracaoImpressaoController } from '../../presentation/controllers/configuracao-impressao/criar-configuracao-impressao.controller.js';
import { DeletarConfiguracaoImpressaoController } from '../../presentation/controllers/configuracao-impressao/deletar-configuracao-impressao.controller.js';
import { DefinirPadraoConfiguracaoImpressaoController } from '../../presentation/controllers/configuracao-impressao/definir-padrao-configuracao-impressao.controller.js';
import { ListarConfiguracoesImpressaoController } from '../../presentation/controllers/configuracao-impressao/listar-configuracoes-impressao.controller.js';
import { AtualizarClienteEspecialController } from '../../presentation/controllers/expedicao/atualizar-cliente-especial.controller.js';
import { CriarClienteEspecialController } from '../../presentation/controllers/expedicao/criar-cliente-especial.controller.js';
import { CriarUploadLoteController } from '../../presentation/controllers/expedicao/criar-upload-lote.controller.js';
import { DeletarClienteEspecialController } from '../../presentation/controllers/expedicao/deletar-cliente-especial.controller.js';
import { DeleteMapaLoteController } from '../../presentation/controllers/expedicao/delete-mapa-lote.controller.js';
import { DeleteTransporteController } from '../../presentation/controllers/expedicao/delete-transporte.controller.js';
import { GerarMapasController } from '../../presentation/controllers/expedicao/gerar-mapas.controller.js';
import { ImprimirMapasController } from '../../presentation/controllers/expedicao/imprimir-mapas.controller.js';
import { ListarClientesEspeciaisController } from '../../presentation/controllers/expedicao/listar-clientes-especiais.controller.js';
import { ListarMapasLotesController } from '../../presentation/controllers/expedicao/listar-mapas-lotes.controller.js';
import { ListarTransportesController } from '../../presentation/controllers/expedicao/listar-transportes.controller.js';
import { ObterClienteEspecialController } from '../../presentation/controllers/expedicao/obter-cliente-especial.controller.js';
import { ObterTorreControleExpedicaoController } from '../../presentation/controllers/expedicao/obter-torre-controle-expedicao.controller.js';
import { ObterMapaLoteController } from '../../presentation/controllers/expedicao/obter-mapa-lote.controller.js';
import { PatchTransportePrioridadeController } from '../../presentation/controllers/expedicao/patch-transporte-prioridade.controller.js';
import { AtualizarDadosCarregamentoTransporteController } from '../../presentation/controllers/expedicao/atualizar-dados-carregamento-transporte.controller.js';
import { SalvarAlocacoesTransportesController } from '../../presentation/controllers/expedicao/salvar-alocacoes-transportes.controller.js';
import { SalvarMapasController } from '../../presentation/controllers/expedicao/salvar-mapas.controller.js';
import { PermissionsGuard } from '../../shared/guards/permissions.guard.js';
import { GerarPdfDeHtmlService } from '../pdf/gerar-pdf-de-html.service.js';
import { ClienteEspecialService } from '../db/expedicao/cliente-especial.service.js';
import { ConfiguracaoImpressaoService } from '../db/configuracao-impressao/configuracao-impressao.service.js';
import { MapaLoteService } from '../db/expedicao/mapa-lote.service.js';
import { UploadLoteService } from '../db/expedicao/upload-lote.service.js';
import { TorreControleService } from '../db/expedicao/torre-controle/torre-controle.service.js';
import { AuthModule } from './auth.module.js';
import { DocaModule } from './doca.module.js';
import { ProdutoModule } from './produto.module.js';
import { UnidadeModule } from './unidade.module.js';
import { ExpedicaoCoreModule } from './expedicao-core.module.js';
import { ExpedicaoTransporteQueueModule } from './expedicao-transporte-queue.module.js';

@Module({
  imports: [
    AuthModule,
    UnidadeModule,
    ProdutoModule,
    DocaModule,
    ExpedicaoCoreModule,
    ExpedicaoTransporteQueueModule,
  ],
  controllers: [
    CriarUploadLoteController,
    ListarTransportesController,
    DeleteTransporteController,
    ObterTorreControleExpedicaoController,
    GerarMapasController,
    SalvarMapasController,
    ImprimirMapasController,
    ListarMapasLotesController,
    ObterMapaLoteController,
    DeleteMapaLoteController,
    SalvarAlocacoesTransportesController,
    PatchTransportePrioridadeController,
    AtualizarDadosCarregamentoTransporteController,
    ListarConfiguracoesImpressaoController,
    CriarConfiguracaoImpressaoController,
    AtualizarConfiguracaoImpressaoController,
    DeletarConfiguracaoImpressaoController,
    DefinirPadraoConfiguracaoImpressaoController,
    ListarClientesEspeciaisController,
    ObterClienteEspecialController,
    CriarClienteEspecialController,
    AtualizarClienteEspecialController,
    DeletarClienteEspecialController,
  ],
  providers: [
    CriarUploadLoteUseCase,
    ExcluirMapaLoteUseCase,
    ExcluirTransporteUseCase,
    ListarTransportesUseCase,
    ObterTorreControleExpedicaoUseCase,
    GerarMapasUseCase,
    SalvarMapasUseCase,
    ImprimirMapasUseCase,
    ListarMapasLotesUseCase,
    ObterMapaLoteUseCase,
    SalvarAlocacoesTransportesUseCase,
    AtualizarPrioridadeTransporteUseCase,
    AtualizarDadosCarregamentoTransporteUseCase,
    ListarConfiguracoesImpressaoUseCase,
    CriarConfiguracaoImpressaoUseCase,
    AtualizarConfiguracaoImpressaoUseCase,
    DeletarConfiguracaoImpressaoUseCase,
    DefinirPadraoConfiguracaoImpressaoUseCase,
    ListarClientesEspeciaisUseCase,
    ObterClienteEspecialUseCase,
    CriarClienteEspecialUseCase,
    AtualizarClienteEspecialUseCase,
    DeletarClienteEspecialUseCase,
    GerarPdfDeHtmlService,
    PermissionsGuard,
    {
      provide: UPLOAD_LOTE_REPOSITORY,
      useClass: UploadLoteService,
    },
    {
      provide: TORRE_CONTROLE_REPOSITORY,
      useClass: TorreControleService,
    },
    {
      provide: MAPA_LOTE_REPOSITORY,
      useClass: MapaLoteService,
    },
    {
      provide: CONFIGURACAO_IMPRESSAO_REPOSITORY,
      useClass: ConfiguracaoImpressaoService,
    },
    {
      provide: CLIENTE_ESPECIAL_REPOSITORY,
      useClass: ClienteEspecialService,
    },
  ],
})
export class ExpedicaoModule {}
