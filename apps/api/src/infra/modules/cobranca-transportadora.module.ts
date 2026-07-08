import { Module } from '@nestjs/common';

import { PortalNotificacaoService } from '../../application/services/portal-notificacao.service.js';
import { AtualizarItemProcessoDebitoUseCase } from '../../application/usecases/cobranca-transportadora/atualizar-item-processo-debito.usecase.js';
import { AtualizarItensProcessoDebitoEmMassaUseCase } from '../../application/usecases/cobranca-transportadora/atualizar-itens-processo-debito-em-massa.usecase.js';
import { AtualizarStatusDocumentoCobrancaUseCase } from '../../application/usecases/cobranca-transportadora/atualizar-status-documento-cobranca.usecase.js';
import { AtualizarStatusProcessoDebitoUseCase } from '../../application/usecases/cobranca-transportadora/atualizar-status-processo-debito.usecase.js';
import { BuscarDocumentoCobrancaUseCase } from '../../application/usecases/cobranca-transportadora/buscar-documento-cobranca.usecase.js';
import { BuscarProcessoDebitoUseCase } from '../../application/usecases/cobranca-transportadora/buscar-processo-debito.usecase.js';
import { CriarDocumentoCobrancaUseCase } from '../../application/usecases/cobranca-transportadora/criar-documento-cobranca.usecase.js';
import { ListarDocumentosCobrancaUseCase } from '../../application/usecases/cobranca-transportadora/listar-documentos-cobranca.usecase.js';
import { ListarProcessosDebitoUseCase } from '../../application/usecases/cobranca-transportadora/listar-processos-debito.usecase.js';
import { RegistrarInteracaoCdUseCase } from '../../application/usecases/cobranca-transportadora/registrar-interacao-cd.usecase.js';
import { RemoverItemProcessoDebitoUseCase } from '../../application/usecases/cobranca-transportadora/remover-item-processo-debito.usecase.js';
import { UploadInteracaoAnexoCdUseCase } from '../../application/usecases/cobranca-transportadora/upload-interacao-anexo-cd.usecase.js';
import { COBRANCA_TRANSPORTADORA_REPOSITORY } from '../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';
import { AtualizarItemProcessoDebitoController } from '../../presentation/controllers/cobranca-transportadora/atualizar-item-processo-debito.controller.js';
import { AtualizarItensProcessoDebitoEmMassaController } from '../../presentation/controllers/cobranca-transportadora/atualizar-itens-processo-debito-em-massa.controller.js';
import { AtualizarStatusDocumentoCobrancaController } from '../../presentation/controllers/cobranca-transportadora/atualizar-status-documento-cobranca.controller.js';
import { AtualizarStatusProcessoDebitoController } from '../../presentation/controllers/cobranca-transportadora/atualizar-status-processo-debito.controller.js';
import { BuscarDocumentoCobrancaController } from '../../presentation/controllers/cobranca-transportadora/buscar-documento-cobranca.controller.js';
import { BuscarProcessoDebitoController } from '../../presentation/controllers/cobranca-transportadora/buscar-processo-debito.controller.js';
import { CriarDocumentoCobrancaController } from '../../presentation/controllers/cobranca-transportadora/criar-documento-cobranca.controller.js';
import { ListarDocumentosCobrancaController } from '../../presentation/controllers/cobranca-transportadora/listar-documentos-cobranca.controller.js';
import { ListarProcessosDebitoController } from '../../presentation/controllers/cobranca-transportadora/listar-processos-debito.controller.js';
import { RegistrarInteracaoCdController } from '../../presentation/controllers/cobranca-transportadora/registrar-interacao-cd.controller.js';
import { RemoverItemProcessoDebitoController } from '../../presentation/controllers/cobranca-transportadora/remover-item-processo-debito.controller.js';
import { UploadInteracaoAnexoCdController } from '../../presentation/controllers/cobranca-transportadora/upload-interacao-anexo-cd.controller.js';
import { PermissionsGuard } from '../../shared/guards/permissions.guard.js';
import { CobrancaTransportadoraService } from '../db/cobranca-transportadora/cobranca-transportadora.service.js';
import { AuthModule } from './auth.module.js';
import { DocumentoModule } from './documento.module.js';

@Module({
  imports: [AuthModule, DocumentoModule],
  controllers: [
    ListarProcessosDebitoController,
    BuscarProcessoDebitoController,
    AtualizarStatusProcessoDebitoController,
    AtualizarItensProcessoDebitoEmMassaController,
    AtualizarItemProcessoDebitoController,
    RemoverItemProcessoDebitoController,
    CriarDocumentoCobrancaController,
    ListarDocumentosCobrancaController,
    BuscarDocumentoCobrancaController,
    AtualizarStatusDocumentoCobrancaController,
    RegistrarInteracaoCdController,
    UploadInteracaoAnexoCdController,
  ],
  providers: [
    ListarProcessosDebitoUseCase,
    BuscarProcessoDebitoUseCase,
    AtualizarStatusProcessoDebitoUseCase,
    AtualizarItemProcessoDebitoUseCase,
    AtualizarItensProcessoDebitoEmMassaUseCase,
    RemoverItemProcessoDebitoUseCase,
    CriarDocumentoCobrancaUseCase,
    ListarDocumentosCobrancaUseCase,
    BuscarDocumentoCobrancaUseCase,
    AtualizarStatusDocumentoCobrancaUseCase,
    RegistrarInteracaoCdUseCase,
    UploadInteracaoAnexoCdUseCase,
    PortalNotificacaoService,
    PermissionsGuard,
    {
      provide: COBRANCA_TRANSPORTADORA_REPOSITORY,
      useClass: CobrancaTransportadoraService,
    },
  ],
  exports: [
    COBRANCA_TRANSPORTADORA_REPOSITORY,
    BuscarProcessoDebitoUseCase,
    RegistrarInteracaoCdUseCase,
    PortalNotificacaoService,
  ],
})
export class CobrancaTransportadoraModule {}
