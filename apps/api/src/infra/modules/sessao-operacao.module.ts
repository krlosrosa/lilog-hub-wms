import { Module } from '@nestjs/common';

import { AbrirSessaoUseCase } from '../../application/usecases/sessao-operacao/abrir-sessao.usecase.js';
import { AddEquipeFuncionarioUseCase } from '../../application/usecases/sessao-operacao/add-equipe-funcionario.usecase.js';
import { AddEscalaFuncionarioUseCase } from '../../application/usecases/sessao-operacao/add-escala-funcionario.usecase.js';
import { CancelarSessaoUseCase } from '../../application/usecases/sessao-operacao/cancelar-sessao.usecase.js';
import { CreateEscalaUseCase } from '../../application/usecases/sessao-operacao/create-escala.usecase.js';
import { CreateSessaoUseCase } from '../../application/usecases/sessao-operacao/create-sessao.usecase.js';
import { EncerrarSessaoUseCase } from '../../application/usecases/sessao-operacao/encerrar-sessao.usecase.js';
import { FinalizarSessaoFuncionarioPausaUseCase } from '../../application/usecases/sessao-operacao/finalizar-sessao-funcionario-pausa.usecase.js';
import { GetFuncionarioEquipeUseCase } from '../../application/usecases/sessao-operacao/get-funcionario-equipe.usecase.js';
import { GetEscalaUseCase } from '../../application/usecases/sessao-operacao/get-escala.usecase.js';
import { GetSessaoUseCase } from '../../application/usecases/sessao-operacao/get-sessao.usecase.js';
import { IniciarSessaoFuncionarioPausaUseCase } from '../../application/usecases/sessao-operacao/iniciar-sessao-funcionario-pausa.usecase.js';
import { ListEscalaFuncionariosUseCase } from '../../application/usecases/sessao-operacao/list-escala-funcionarios.usecase.js';
import { ListEquipesUseCase } from '../../application/usecases/sessao-operacao/list-equipes.usecase.js';
import { ListEscalasUseCase } from '../../application/usecases/sessao-operacao/list-escalas.usecase.js';
import { ListSessaoFuncionarioPausasUseCase } from '../../application/usecases/sessao-operacao/list-sessao-funcionario-pausas.usecase.js';
import { ListSessaoFuncionariosUseCase } from '../../application/usecases/sessao-operacao/list-sessao-funcionarios.usecase.js';
import { ListSessoesUseCase } from '../../application/usecases/sessao-operacao/list-sessoes.usecase.js';
import { RemoveEscalaFuncionarioUseCase } from '../../application/usecases/sessao-operacao/remove-escala-funcionario.usecase.js';
import { UpdateSessaoFuncionarioPresencaUseCase } from '../../application/usecases/sessao-operacao/update-sessao-funcionario-presenca.usecase.js';
import { SESSAO_OPERACAO_REPOSITORY } from '../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import { AbrirSessaoController } from '../../presentation/controllers/sessao-operacao/abrir-sessao.controller.js';
import { AddEquipeFuncionarioController } from '../../presentation/controllers/sessao-operacao/add-equipe-funcionario.controller.js';
import { AddEscalaFuncionarioController } from '../../presentation/controllers/sessao-operacao/add-escala-funcionario.controller.js';
import { CancelarSessaoController } from '../../presentation/controllers/sessao-operacao/cancelar-sessao.controller.js';
import { CreateEscalaController } from '../../presentation/controllers/sessao-operacao/create-escala.controller.js';
import { CreateSessaoController } from '../../presentation/controllers/sessao-operacao/create-sessao.controller.js';
import { EncerrarSessaoController } from '../../presentation/controllers/sessao-operacao/encerrar-sessao.controller.js';
import { GetFuncionarioEquipeController } from '../../presentation/controllers/sessao-operacao/get-funcionario-equipe.controller.js';
import { GetEscalaController } from '../../presentation/controllers/sessao-operacao/get-escala.controller.js';
import { GetSessaoController } from '../../presentation/controllers/sessao-operacao/get-sessao.controller.js';
import { FinalizarSessaoFuncionarioPausaController } from '../../presentation/controllers/sessao-operacao/finalizar-sessao-funcionario-pausa.controller.js';
import { IniciarSessaoFuncionarioPausaController } from '../../presentation/controllers/sessao-operacao/iniciar-sessao-funcionario-pausa.controller.js';
import { ListSessaoFuncionarioPausasController } from '../../presentation/controllers/sessao-operacao/list-sessao-funcionario-pausas.controller.js';
import { ListEscalaFuncionariosController } from '../../presentation/controllers/sessao-operacao/list-escala-funcionarios.controller.js';
import { ListEquipesController } from '../../presentation/controllers/sessao-operacao/list-equipes.controller.js';
import { ListEscalasController } from '../../presentation/controllers/sessao-operacao/list-escalas.controller.js';
import { ListSessaoFuncionariosController } from '../../presentation/controllers/sessao-operacao/list-sessao-funcionarios.controller.js';
import { ListSessoesController } from '../../presentation/controllers/sessao-operacao/list-sessoes.controller.js';
import { RemoveEscalaFuncionarioController } from '../../presentation/controllers/sessao-operacao/remove-escala-funcionario.controller.js';
import { UpdateSessaoFuncionarioPresencaController } from '../../presentation/controllers/sessao-operacao/update-sessao-funcionario-presenca.controller.js';
import { PermissionsGuard } from '../../shared/guards/permissions.guard.js';
import { SessaoOperacaoService } from '../db/sessao-operacao/sessao-operacao.service.js';
import { AuthModule } from './auth.module.js';
import { FuncionarioModule } from './funcionario.module.js';

@Module({
  imports: [AuthModule, FuncionarioModule],
  controllers: [
    ListEscalasController,
    ListEquipesController,
    ListSessoesController,
    CreateEscalaController,
    CreateSessaoController,
    GetEscalaController,
    GetSessaoController,
    GetFuncionarioEquipeController,
    ListEscalaFuncionariosController,
    ListSessaoFuncionariosController,
    AddEscalaFuncionarioController,
    AddEquipeFuncionarioController,
    UpdateSessaoFuncionarioPresencaController,
    ListSessaoFuncionarioPausasController,
    IniciarSessaoFuncionarioPausaController,
    FinalizarSessaoFuncionarioPausaController,
    AbrirSessaoController,
    EncerrarSessaoController,
    CancelarSessaoController,
    RemoveEscalaFuncionarioController,
  ],
  providers: [
    ListEscalasUseCase,
    ListEquipesUseCase,
    ListSessoesUseCase,
    CreateEscalaUseCase,
    CreateSessaoUseCase,
    GetEscalaUseCase,
    GetSessaoUseCase,
    GetFuncionarioEquipeUseCase,
    ListEscalaFuncionariosUseCase,
    ListSessaoFuncionariosUseCase,
    AddEscalaFuncionarioUseCase,
    AddEquipeFuncionarioUseCase,
    UpdateSessaoFuncionarioPresencaUseCase,
    ListSessaoFuncionarioPausasUseCase,
    IniciarSessaoFuncionarioPausaUseCase,
    FinalizarSessaoFuncionarioPausaUseCase,
    AbrirSessaoUseCase,
    EncerrarSessaoUseCase,
    CancelarSessaoUseCase,
    RemoveEscalaFuncionarioUseCase,
    PermissionsGuard,
    {
      provide: SESSAO_OPERACAO_REPOSITORY,
      useClass: SessaoOperacaoService,
    },
  ],
  exports: [SESSAO_OPERACAO_REPOSITORY],
})
export class SessaoOperacaoModule {}
