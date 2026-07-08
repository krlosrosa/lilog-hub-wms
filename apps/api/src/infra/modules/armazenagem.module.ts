import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { ArmazenagemSaldoEventPublisher } from '../../application/services/armazenagem/armazenagem-saldo-event.publisher.js';

import { BuscarTarefaArmazenagemPorEtiquetaUseCase } from '../../application/usecases/armazenagem/buscar-tarefa-armazenagem-por-etiqueta.usecase.js';

import { ConcluirDemandaArmazenagemUseCase } from '../../application/usecases/armazenagem/concluir-demanda-armazenagem.usecase.js';

import { ConfirmarItemArmazenagemUseCase } from '../../application/usecases/armazenagem/confirmar-item-armazenagem.usecase.js';

import { ConfirmarTarefaArmazenagemUseCase } from '../../application/usecases/armazenagem/confirmar-tarefa-armazenagem.usecase.js';

import { CreateRegraEnderecamentoUseCase } from '../../application/usecases/armazenagem/create-regra-enderecamento.usecase.js';

import { DeleteRegraEnderecamentoUseCase } from '../../application/usecases/armazenagem/delete-regra-enderecamento.usecase.js';

import { DefinirEnderecoSugeridoItemArmazenagemUseCase } from '../../application/usecases/armazenagem/definir-endereco-sugerido-item-armazenagem.usecase.js';

import { DefinirEnderecoSugeridoTarefaArmazenagemUseCase } from '../../application/usecases/armazenagem/definir-endereco-sugerido-tarefa-armazenagem.usecase.js';

import { GetRegraEnderecamentoUseCase } from '../../application/usecases/armazenagem/get-regra-enderecamento.usecase.js';

import { GerarDemandaArmazenagemUseCase } from '../../application/usecases/armazenagem/gerar-demanda-armazenagem.usecase.js';

import { IniciarDemandaArmazenagemUseCase } from '../../application/usecases/armazenagem/iniciar-demanda-armazenagem.usecase.js';

import { IniciarTarefaArmazenagemUseCase } from '../../application/usecases/armazenagem/iniciar-tarefa-armazenagem.usecase.js';

import {

  GetDemandaArmazenagemUseCase,

  ListDemandasArmazenagemUseCase,

} from '../../application/usecases/armazenagem/list-demandas-armazenagem.usecase.js';

import { ListEnderecosDisponiveisArmazenagemUseCase } from '../../application/usecases/armazenagem/list-enderecos-disponiveis-armazenagem.usecase.js';

import { ListRegrasEnderecamentoUseCase } from '../../application/usecases/armazenagem/list-regras-enderecamento.usecase.js';

import { ProcessarSaldoItemArmazenagemUseCase } from '../../application/usecases/armazenagem/processar-saldo-item-armazenagem.usecase.js';

import { ProcessarSaldoTarefaArmazenagemUseCase } from '../../application/usecases/armazenagem/processar-saldo-tarefa-armazenagem.usecase.js';

import { SugerirEnderecosDemandaArmazenagemUseCase } from '../../application/usecases/armazenagem/sugerir-enderecos-demanda-armazenagem.usecase.js';

import { UpdateRegraEnderecamentoUseCase } from '../../application/usecases/armazenagem/update-regra-enderecamento.usecase.js';

import { ValidarDemandaArmazenagemUseCase } from '../../application/usecases/armazenagem/validar-demanda-armazenagem.usecase.js';

import { ARMAZENAGEM_REPOSITORY } from '../../domain/repositories/armazenagem/armazenagem.repository.js';

import { REGRA_ENDERECAMENTO_REPOSITORY } from '../../domain/repositories/armazenagem/regra-enderecamento.repository.js';

import { BuscarTarefaArmazenagemPorEtiquetaController } from '../../presentation/controllers/armazenagem/buscar-tarefa-armazenagem-por-etiqueta.controller.js';

import { ConcluirDemandaArmazenagemController } from '../../presentation/controllers/armazenagem/concluir-demanda-armazenagem.controller.js';

import { ConfirmarItemArmazenagemController } from '../../presentation/controllers/armazenagem/confirmar-item-armazenagem.controller.js';

import { ConfirmarTarefaArmazenagemController } from '../../presentation/controllers/armazenagem/confirmar-tarefa-armazenagem.controller.js';

import { CreateRegraEnderecamentoController } from '../../presentation/controllers/armazenagem/create-regra-enderecamento.controller.js';

import { DefinirEnderecoSugeridoItemArmazenagemController } from '../../presentation/controllers/armazenagem/definir-endereco-sugerido-item-armazenagem.controller.js';

import { DefinirEnderecoSugeridoTarefaArmazenagemController } from '../../presentation/controllers/armazenagem/definir-endereco-sugerido-tarefa-armazenagem.controller.js';

import { DeleteRegraEnderecamentoController } from '../../presentation/controllers/armazenagem/delete-regra-enderecamento.controller.js';

import { GetDemandaArmazenagemController } from '../../presentation/controllers/armazenagem/get-demanda-armazenagem.controller.js';

import { GetRegraEnderecamentoController } from '../../presentation/controllers/armazenagem/get-regra-enderecamento.controller.js';

import { IniciarDemandaArmazenagemController } from '../../presentation/controllers/armazenagem/iniciar-demanda-armazenagem.controller.js';

import { IniciarTarefaArmazenagemController } from '../../presentation/controllers/armazenagem/iniciar-tarefa-armazenagem.controller.js';

import { ListDemandasArmazenagemController } from '../../presentation/controllers/armazenagem/list-demandas-armazenagem.controller.js';

import { ListEnderecosDisponiveisArmazenagemController } from '../../presentation/controllers/armazenagem/list-enderecos-disponiveis-armazenagem.controller.js';

import { ListRegrasEnderecamentoController } from '../../presentation/controllers/armazenagem/list-regras-enderecamento.controller.js';

import { UpdateRegraEnderecamentoController } from '../../presentation/controllers/armazenagem/update-regra-enderecamento.controller.js';

import { ValidarDemandaArmazenagemController } from '../../presentation/controllers/armazenagem/validar-demanda-armazenagem.controller.js';

import { ArmazenagemService } from '../db/armazenagem/armazenagem.service.js';

import { RegraEnderecamentoService } from '../db/armazenagem/regra-enderecamento.service.js';

import { ProcessarSaldoArmazenagemProcessor } from '../queues/armazenagem/processar-saldo-armazenagem.processor.js';

import { ARMAZENAGEM_QUEUE } from '../queues/armazenagem.queue.js';

import { AuthModule } from './auth.module.js';

import { EnderecoModule } from './endereco.module.js';

import { EstoqueModule } from './estoque.module.js';

import { ProdutoModule } from './produto.module.js';



@Module({

  imports: [
    AuthModule,
    EstoqueModule,
    EnderecoModule,
    ProdutoModule,
    BullModule.registerQueue({ name: ARMAZENAGEM_QUEUE }),
    BullBoardModule.forFeature({
      name: ARMAZENAGEM_QUEUE,
      adapter: BullMQAdapter,
    }),
  ],

  controllers: [

    ListDemandasArmazenagemController,

    GetDemandaArmazenagemController,

    IniciarDemandaArmazenagemController,

    IniciarTarefaArmazenagemController,

    ConfirmarItemArmazenagemController,

    ConfirmarTarefaArmazenagemController,

    ConcluirDemandaArmazenagemController,

    ValidarDemandaArmazenagemController,

    ListEnderecosDisponiveisArmazenagemController,

    DefinirEnderecoSugeridoItemArmazenagemController,

    DefinirEnderecoSugeridoTarefaArmazenagemController,

    CreateRegraEnderecamentoController,

    ListRegrasEnderecamentoController,

    GetRegraEnderecamentoController,

    UpdateRegraEnderecamentoController,

    DeleteRegraEnderecamentoController,

    BuscarTarefaArmazenagemPorEtiquetaController,

  ],

  providers: [

    ListDemandasArmazenagemUseCase,

    GetDemandaArmazenagemUseCase,

    ListEnderecosDisponiveisArmazenagemUseCase,

    DefinirEnderecoSugeridoItemArmazenagemUseCase,

    DefinirEnderecoSugeridoTarefaArmazenagemUseCase,

    IniciarDemandaArmazenagemUseCase,

    IniciarTarefaArmazenagemUseCase,

    ConfirmarItemArmazenagemUseCase,

    ConfirmarTarefaArmazenagemUseCase,

    ConcluirDemandaArmazenagemUseCase,

    ValidarDemandaArmazenagemUseCase,

    GerarDemandaArmazenagemUseCase,

    SugerirEnderecosDemandaArmazenagemUseCase,

    CreateRegraEnderecamentoUseCase,

    ListRegrasEnderecamentoUseCase,

    GetRegraEnderecamentoUseCase,

    UpdateRegraEnderecamentoUseCase,

    DeleteRegraEnderecamentoUseCase,

    BuscarTarefaArmazenagemPorEtiquetaUseCase,

    ProcessarSaldoItemArmazenagemUseCase,

    ProcessarSaldoTarefaArmazenagemUseCase,

    ProcessarSaldoArmazenagemProcessor,

    ArmazenagemSaldoEventPublisher,

    {

      provide: ARMAZENAGEM_REPOSITORY,

      useClass: ArmazenagemService,

    },

    {

      provide: REGRA_ENDERECAMENTO_REPOSITORY,

      useClass: RegraEnderecamentoService,

    },

  ],

  exports: [

    GerarDemandaArmazenagemUseCase,

    ARMAZENAGEM_REPOSITORY,

    REGRA_ENDERECAMENTO_REPOSITORY,

  ],

})

export class ArmazenagemModule {}


