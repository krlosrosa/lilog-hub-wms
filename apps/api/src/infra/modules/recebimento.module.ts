import { Module } from '@nestjs/common';

import { RecebimentoEventPublisher } from '../../application/services/recebimento-event.publisher.js';
import { AprovarRecebimentoUseCase } from '../../application/usecases/recebimento/aprovar-recebimento.usecase.js';
import { CancelPreRecebimentoUseCase } from '../../application/usecases/recebimento/cancel-pre-recebimento.usecase.js';
import { CheckinVeiculoUseCase } from '../../application/usecases/recebimento/checkin-veiculo.usecase.js';
import { ConferirItemUseCase } from '../../application/usecases/recebimento/conferir-item.usecase.js';
import { CreateChecklistRecebimentoUseCase } from '../../application/usecases/recebimento/create-checklist-recebimento.usecase.js';
import { GetChecklistRecebimentoUseCase } from '../../application/usecases/recebimento/get-checklist-recebimento.usecase.js';
import { CreatePreRecebimentoUseCase } from '../../application/usecases/recebimento/create-pre-recebimento.usecase.js';
import { EncerrarConferenciaUseCase } from '../../application/usecases/recebimento/encerrar-conferencia.usecase.js';
import { FinalizarRecebimentoUseCase } from '../../application/usecases/recebimento/finalizar-recebimento.usecase.js';
import { GetConferenciaContextUseCase } from '../../application/usecases/recebimento/get-conferencia-context.usecase.js';
import { GetPreRecebimentoUseCase } from '../../application/usecases/recebimento/get-pre-recebimento.usecase.js';
import { ListOperadorDemandasUseCase } from '../../application/usecases/recebimento/list-operador-demandas.usecase.js';
import { ListRecebimentoAvariasUseCase } from '../../application/usecases/recebimento/list-recebimento-avarias.usecase.js';
import { RegistrarAvariaUseCase } from '../../application/usecases/recebimento/registrar-avaria.usecase.js';
import { GetRecebimentoByPreRecebimentoUseCase } from '../../application/usecases/recebimento/get-recebimento-by-pre-recebimento.usecase.js';
import { GetRecebimentoUseCase } from '../../application/usecases/recebimento/get-recebimento.usecase.js';
import { IniciarRecebimentoUseCase } from '../../application/usecases/recebimento/iniciar-recebimento.usecase.js';
import { ListPreRecebimentosUseCase } from '../../application/usecases/recebimento/list-pre-recebimentos.usecase.js';
import { ListRecebimentosUseCase } from '../../application/usecases/recebimento/list-recebimentos.usecase.js';
import { UpdatePreRecebimentoUseCase } from '../../application/usecases/recebimento/update-pre-recebimento.usecase.js';
import { CONFERENCIA_REPOSITORY } from '../../domain/repositories/recebimento/conferencia.repository.js';
import { PRE_RECEBIMENTO_REPOSITORY } from '../../domain/repositories/recebimento/pre-recebimento.repository.js';
import { RECEBIMENTO_AVARIA_REPOSITORY } from '../../domain/repositories/recebimento/recebimento-avaria.repository.js';
import { RECEBIMENTO_REPOSITORY } from '../../domain/repositories/recebimento/recebimento.repository.js';
import { AprovarRecebimentoController } from '../../presentation/controllers/recebimento/aprovar-recebimento.controller.js';
import { CancelPreRecebimentoController } from '../../presentation/controllers/recebimento/cancel-pre-recebimento.controller.js';
import { CheckinVeiculoController } from '../../presentation/controllers/recebimento/checkin-veiculo.controller.js';
import { ConferirItemController } from '../../presentation/controllers/recebimento/conferir-item.controller.js';
import { CreateChecklistRecebimentoController } from '../../presentation/controllers/recebimento/create-checklist-recebimento.controller.js';
import { GetChecklistRecebimentoController } from '../../presentation/controllers/recebimento/get-checklist-recebimento.controller.js';
import { CreatePreRecebimentoController } from '../../presentation/controllers/recebimento/create-pre-recebimento.controller.js';
import { EncerrarConferenciaController } from '../../presentation/controllers/recebimento/encerrar-conferencia.controller.js';
import { FinalizarRecebimentoController } from '../../presentation/controllers/recebimento/finalizar-recebimento.controller.js';
import { GetConferenciaContextController } from '../../presentation/controllers/recebimento/get-conferencia-context.controller.js';
import { GetPreRecebimentoController } from '../../presentation/controllers/recebimento/get-pre-recebimento.controller.js';
import { ListOperadorDemandasController } from '../../presentation/controllers/recebimento/list-operador-demandas.controller.js';
import { ListRecebimentoAvariasController } from '../../presentation/controllers/recebimento/list-recebimento-avarias.controller.js';
import { RegistrarAvariaController } from '../../presentation/controllers/recebimento/registrar-avaria.controller.js';
import { GetRecebimentoByPreRecebimentoController } from '../../presentation/controllers/recebimento/get-recebimento-by-pre-recebimento.controller.js';
import { GetRecebimentoController } from '../../presentation/controllers/recebimento/get-recebimento.controller.js';
import { IniciarRecebimentoController } from '../../presentation/controllers/recebimento/iniciar-recebimento.controller.js';
import { ListPreRecebimentosController } from '../../presentation/controllers/recebimento/list-pre-recebimentos.controller.js';
import { ListRecebimentosController } from '../../presentation/controllers/recebimento/list-recebimentos.controller.js';
import { UpdatePreRecebimentoController } from '../../presentation/controllers/recebimento/update-pre-recebimento.controller.js';
import { PermissionsGuard } from '../../shared/guards/permissions.guard.js';
import { ConferenciaService } from '../db/recebimento/conferencia.service.js';
import { PreRecebimentoService } from '../db/recebimento/pre-recebimento.service.js';
import { RecebimentoAvariaService } from '../db/recebimento/recebimento-avaria.service.js';
import { RecebimentoService } from '../db/recebimento/recebimento.service.js';
import { AuditLogModule } from './audit-log.module.js';
import { AuthModule } from './auth.module.js';
import { CncModule } from './cnc.module.js';
import { DocaModule } from './doca.module.js';
import { EstoqueModule } from './estoque.module.js';
import { ArmazenagemModule } from './armazenagem.module.js';
import { FuncionarioModule } from './funcionario.module.js';
import { ProdutoModule } from './produto.module.js';
import { UnidadeModule } from './unidade.module.js';
import { UserModule } from './user.module.js';

@Module({
  imports: [
    AuthModule,
    AuditLogModule,
    UnidadeModule,
    ProdutoModule,
    DocaModule,
    FuncionarioModule,
    CncModule,
    EstoqueModule,
    ArmazenagemModule,
    UserModule,
  ],
  controllers: [
    ListOperadorDemandasController,
    ListRecebimentoAvariasController,
    ListPreRecebimentosController,
    GetConferenciaContextController,
    GetRecebimentoByPreRecebimentoController,
    GetPreRecebimentoController,
    ListRecebimentosController,
    CreatePreRecebimentoController,
    UpdatePreRecebimentoController,
    CancelPreRecebimentoController,
    CheckinVeiculoController,
    IniciarRecebimentoController,
    ConferirItemController,
    CreateChecklistRecebimentoController,
    GetChecklistRecebimentoController,
    EncerrarConferenciaController,
    AprovarRecebimentoController,
    FinalizarRecebimentoController,
    GetRecebimentoController,
    RegistrarAvariaController,
  ],
  providers: [
    CreatePreRecebimentoUseCase,
    UpdatePreRecebimentoUseCase,
    CancelPreRecebimentoUseCase,
    CheckinVeiculoUseCase,
    IniciarRecebimentoUseCase,
    ConferirItemUseCase,
    CreateChecklistRecebimentoUseCase,
    GetChecklistRecebimentoUseCase,
    EncerrarConferenciaUseCase,
    AprovarRecebimentoUseCase,
    FinalizarRecebimentoUseCase,
    ListPreRecebimentosUseCase,
    ListRecebimentosUseCase,
    GetPreRecebimentoUseCase,
    GetRecebimentoByPreRecebimentoUseCase,
    GetRecebimentoUseCase,
    ListOperadorDemandasUseCase,
    GetConferenciaContextUseCase,
    RegistrarAvariaUseCase,
    ListRecebimentoAvariasUseCase,
    RecebimentoEventPublisher,
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
  ],
})
export class RecebimentoModule {}
