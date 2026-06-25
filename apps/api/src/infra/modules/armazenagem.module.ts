import { Module } from '@nestjs/common';

import { ConcluirDemandaArmazenagemUseCase } from '../../application/usecases/armazenagem/concluir-demanda-armazenagem.usecase.js';
import { ConfirmarItemArmazenagemUseCase } from '../../application/usecases/armazenagem/confirmar-item-armazenagem.usecase.js';
import { GerarDemandaArmazenagemUseCase } from '../../application/usecases/armazenagem/gerar-demanda-armazenagem.usecase.js';
import { IniciarDemandaArmazenagemUseCase } from '../../application/usecases/armazenagem/iniciar-demanda-armazenagem.usecase.js';
import {
  GetDemandaArmazenagemUseCase,
  ListDemandasArmazenagemUseCase,
} from '../../application/usecases/armazenagem/list-demandas-armazenagem.usecase.js';
import { ListEnderecosDisponiveisArmazenagemUseCase } from '../../application/usecases/armazenagem/list-enderecos-disponiveis-armazenagem.usecase.js';
import { ARMAZENAGEM_REPOSITORY } from '../../domain/repositories/armazenagem/armazenagem.repository.js';
import { DefinirEnderecoSugeridoItemArmazenagemUseCase } from '../../application/usecases/armazenagem/definir-endereco-sugerido-item-armazenagem.usecase.js';
import { ConcluirDemandaArmazenagemController } from '../../presentation/controllers/armazenagem/concluir-demanda-armazenagem.controller.js';
import { ConfirmarItemArmazenagemController } from '../../presentation/controllers/armazenagem/confirmar-item-armazenagem.controller.js';
import { DefinirEnderecoSugeridoItemArmazenagemController } from '../../presentation/controllers/armazenagem/definir-endereco-sugerido-item-armazenagem.controller.js';
import { GetDemandaArmazenagemController } from '../../presentation/controllers/armazenagem/get-demanda-armazenagem.controller.js';
import { IniciarDemandaArmazenagemController } from '../../presentation/controllers/armazenagem/iniciar-demanda-armazenagem.controller.js';
import { ListDemandasArmazenagemController } from '../../presentation/controllers/armazenagem/list-demandas-armazenagem.controller.js';
import { ListEnderecosDisponiveisArmazenagemController } from '../../presentation/controllers/armazenagem/list-enderecos-disponiveis-armazenagem.controller.js';
import { ArmazenagemService } from '../db/armazenagem/armazenagem.service.js';
import { AuthModule } from './auth.module.js';
import { EnderecoModule } from './endereco.module.js';
import { EstoqueModule } from './estoque.module.js';

@Module({
  imports: [AuthModule, EstoqueModule, EnderecoModule],
  controllers: [
    ListDemandasArmazenagemController,
    GetDemandaArmazenagemController,
    IniciarDemandaArmazenagemController,
    ConfirmarItemArmazenagemController,
    ConcluirDemandaArmazenagemController,
    ListEnderecosDisponiveisArmazenagemController,
    DefinirEnderecoSugeridoItemArmazenagemController,
  ],
  providers: [
    ListDemandasArmazenagemUseCase,
    GetDemandaArmazenagemUseCase,
    ListEnderecosDisponiveisArmazenagemUseCase,
    DefinirEnderecoSugeridoItemArmazenagemUseCase,
    IniciarDemandaArmazenagemUseCase,
    ConfirmarItemArmazenagemUseCase,
    ConcluirDemandaArmazenagemUseCase,
    GerarDemandaArmazenagemUseCase,
    {
      provide: ARMAZENAGEM_REPOSITORY,
      useClass: ArmazenagemService,
    },
  ],
  exports: [GerarDemandaArmazenagemUseCase, ARMAZENAGEM_REPOSITORY],
})
export class ArmazenagemModule {}
