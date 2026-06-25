import { Module } from '@nestjs/common';

import { AtualizarConfiguracaoOperacionalUseCase } from '../../application/usecases/configuracao-operacional/atualizar-configuracao-operacional.usecase.js';
import { CriarConfiguracaoOperacionalUseCase } from '../../application/usecases/configuracao-operacional/criar-configuracao-operacional.usecase.js';
import { DeletarConfiguracaoOperacionalUseCase } from '../../application/usecases/configuracao-operacional/deletar-configuracao-operacional.usecase.js';
import { DefinirPadraoConfiguracaoOperacionalUseCase } from '../../application/usecases/configuracao-operacional/definir-padrao-configuracao-operacional.usecase.js';
import { DuplicarConfiguracaoOperacionalUseCase } from '../../application/usecases/configuracao-operacional/duplicar-configuracao-operacional.usecase.js';
import { ListarConfiguracoesOperacionaisUseCase } from '../../application/usecases/configuracao-operacional/listar-configuracoes-operacionais.usecase.js';
import { ObterConfiguracaoOperacionalUseCase } from '../../application/usecases/configuracao-operacional/obter-configuracao-operacional.usecase.js';
import { CONFIGURACAO_OPERACIONAL_REPOSITORY } from '../../domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
import { AtualizarConfiguracaoOperacionalController } from '../../presentation/controllers/configuracao-operacional/atualizar-configuracao-operacional.controller.js';
import { CriarConfiguracaoOperacionalController } from '../../presentation/controllers/configuracao-operacional/criar-configuracao-operacional.controller.js';
import { DeletarConfiguracaoOperacionalController } from '../../presentation/controllers/configuracao-operacional/deletar-configuracao-operacional.controller.js';
import { DefinirPadraoConfiguracaoOperacionalController } from '../../presentation/controllers/configuracao-operacional/definir-padrao-configuracao-operacional.controller.js';
import { DuplicarConfiguracaoOperacionalController } from '../../presentation/controllers/configuracao-operacional/duplicar-configuracao-operacional.controller.js';
import { ListarConfiguracoesOperacionaisController } from '../../presentation/controllers/configuracao-operacional/listar-configuracoes-operacionais.controller.js';
import { ObterConfiguracaoOperacionalController } from '../../presentation/controllers/configuracao-operacional/obter-configuracao-operacional.controller.js';
import { PermissionsGuard } from '../../shared/guards/permissions.guard.js';
import { ConfiguracaoOperacionalService } from '../db/configuracao-operacional/configuracao-operacional.service.js';
import { AuthModule } from './auth.module.js';
import { UnidadeModule } from './unidade.module.js';

@Module({
  imports: [AuthModule, UnidadeModule],
  controllers: [
    ListarConfiguracoesOperacionaisController,
    ObterConfiguracaoOperacionalController,
    CriarConfiguracaoOperacionalController,
    AtualizarConfiguracaoOperacionalController,
    DeletarConfiguracaoOperacionalController,
    DefinirPadraoConfiguracaoOperacionalController,
    DuplicarConfiguracaoOperacionalController,
  ],
  providers: [
    ListarConfiguracoesOperacionaisUseCase,
    ObterConfiguracaoOperacionalUseCase,
    CriarConfiguracaoOperacionalUseCase,
    AtualizarConfiguracaoOperacionalUseCase,
    DeletarConfiguracaoOperacionalUseCase,
    DefinirPadraoConfiguracaoOperacionalUseCase,
    DuplicarConfiguracaoOperacionalUseCase,
    PermissionsGuard,
    {
      provide: CONFIGURACAO_OPERACIONAL_REPOSITORY,
      useClass: ConfiguracaoOperacionalService,
    },
  ],
  exports: [CONFIGURACAO_OPERACIONAL_REPOSITORY],
})
export class OperacionalModule {}
