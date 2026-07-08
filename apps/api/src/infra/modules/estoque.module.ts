import { Module } from '@nestjs/common';

import { BloquearSaldoEnderecoUseCase } from '../../application/usecases/estoque/bloquear-saldo-endereco.usecase.js';
import { AjustarSaldoEnderecoUseCase } from '../../application/usecases/estoque/ajustar-saldo-endereco.usecase.js';
import { GetSaldoEnderecoUseCase } from '../../application/usecases/estoque/get-saldo-endereco.usecase.js';
import { TransferirSaldoEnderecoUseCase } from '../../application/usecases/estoque/transferir-saldo-endereco.usecase.js';
import { CreateDepositoUseCase } from '../../application/usecases/estoque/create-deposito.usecase.js';
import { CreateMotivoBloqueioSaldoUseCase } from '../../application/usecases/estoque/create-motivo-bloqueio-saldo.usecase.js';
import { DeleteMotivoBloqueioSaldoUseCase } from '../../application/usecases/estoque/delete-motivo-bloqueio-saldo.usecase.js';
import { DesbloquearSaldoEnderecoUseCase } from '../../application/usecases/estoque/desbloquear-saldo-endereco.usecase.js';
import { EnsureDepositosUnidadeUseCase } from '../../application/usecases/estoque/ensure-depositos-unidade.usecase.js';
import { ListDisponibilidadeEstoqueUseCase } from '../../application/usecases/estoque/list-disponibilidade-estoque.usecase.js';
import { ListDisponibilidadeEstoqueAgrupadoUseCase } from '../../application/usecases/estoque/list-disponibilidade-estoque-agrupado.usecase.js';
import { ListGruposDisponibilidadeEstoqueUseCase } from '../../application/usecases/estoque/list-grupos-disponibilidade-estoque.usecase.js';
import { ListHistoricoProdutoUseCase } from '../../application/usecases/estoque/list-historico-produto.usecase.js';
import { ListDepositosUseCase } from '../../application/usecases/estoque/list-depositos.usecase.js';
import { ListMotivosBloqueioSaldoUseCase } from '../../application/usecases/estoque/list-motivos-bloqueio-saldo.usecase.js';
import { ListSaldosEnderecoUseCase } from '../../application/usecases/estoque/list-saldos-endereco.usecase.js';
import { ObterExposicaoEstoqueUseCase } from '../../application/usecases/estoque/obter-exposicao-estoque.usecase.js';
import { UpdateDepositoUseCase } from '../../application/usecases/estoque/update-deposito.usecase.js';
import { UpdateMotivoBloqueioSaldoUseCase } from '../../application/usecases/estoque/update-motivo-bloqueio-saldo.usecase.js';
import { ESTOQUE_REPOSITORY } from '../../domain/repositories/estoque/estoque.repository.js';
import { MOTIVO_BLOQUEIO_SALDO_REPOSITORY } from '../../domain/repositories/estoque/motivo-bloqueio-saldo.repository.js';
import { BloquearSaldoEnderecoController } from '../../presentation/controllers/estoque/bloquear-saldo-endereco.controller.js';
import { AjustarSaldoEnderecoController } from '../../presentation/controllers/estoque/ajustar-saldo-endereco.controller.js';
import { GetSaldoEnderecoController } from '../../presentation/controllers/estoque/get-saldo-endereco.controller.js';
import { TransferirSaldoEnderecoController } from '../../presentation/controllers/estoque/transferir-saldo-endereco.controller.js';
import { CreateDepositoController } from '../../presentation/controllers/estoque/create-deposito.controller.js';
import { CreateMotivoBloqueioSaldoController } from '../../presentation/controllers/estoque/create-motivo-bloqueio-saldo.controller.js';
import { DeleteMotivoBloqueioSaldoController } from '../../presentation/controllers/estoque/delete-motivo-bloqueio-saldo.controller.js';
import { DesbloquearSaldoEnderecoController } from '../../presentation/controllers/estoque/desbloquear-saldo-endereco.controller.js';
import { ListDisponibilidadeEstoqueController } from '../../presentation/controllers/estoque/list-disponibilidade-estoque.controller.js';
import { ListDisponibilidadeEstoqueAgrupadoController } from '../../presentation/controllers/estoque/list-disponibilidade-estoque-agrupado.controller.js';
import { ListHistoricoProdutoController } from '../../presentation/controllers/estoque/list-historico-produto.controller.js';
import { ListDepositosController } from '../../presentation/controllers/estoque/list-depositos.controller.js';
import { ListMotivosBloqueioSaldoController } from '../../presentation/controllers/estoque/list-motivos-bloqueio-saldo.controller.js';
import { ListSaldosEnderecoController } from '../../presentation/controllers/estoque/list-saldos-endereco.controller.js';
import { ObterExposicaoEstoqueController } from '../../presentation/controllers/estoque/obter-exposicao-estoque.controller.js';
import { UpdateDepositoController } from '../../presentation/controllers/estoque/update-deposito.controller.js';
import { UpdateMotivoBloqueioSaldoController } from '../../presentation/controllers/estoque/update-motivo-bloqueio-saldo.controller.js';
import { EstoqueService } from '../db/estoque/estoque.service.js';
import { MotivoBloqueioSaldoService } from '../db/estoque/motivo-bloqueio-saldo.service.js';
import { AuthModule } from './auth.module.js';
import { CncModule } from './cnc.module.js';
import { CobrancaTransportadoraModule } from './cobranca-transportadora.module.js';
import { ProdutoModule } from './produto.module.js';

@Module({
  imports: [AuthModule, ProdutoModule, CncModule, CobrancaTransportadoraModule],
  controllers: [
    ListDepositosController,
    ListDisponibilidadeEstoqueController,
    ListDisponibilidadeEstoqueAgrupadoController,
    ListHistoricoProdutoController,
    ObterExposicaoEstoqueController,
    ListSaldosEnderecoController,
    GetSaldoEnderecoController,
    CreateDepositoController,
    UpdateDepositoController,
    CreateMotivoBloqueioSaldoController,
    ListMotivosBloqueioSaldoController,
    UpdateMotivoBloqueioSaldoController,
    DeleteMotivoBloqueioSaldoController,
    BloquearSaldoEnderecoController,
    DesbloquearSaldoEnderecoController,
    AjustarSaldoEnderecoController,
    TransferirSaldoEnderecoController,
  ],
  providers: [
    EnsureDepositosUnidadeUseCase,
    ListDepositosUseCase,
    ListDisponibilidadeEstoqueUseCase,
    ListDisponibilidadeEstoqueAgrupadoUseCase,
    ListGruposDisponibilidadeEstoqueUseCase,
    ListHistoricoProdutoUseCase,
    ObterExposicaoEstoqueUseCase,
    ListSaldosEnderecoUseCase,
    GetSaldoEnderecoUseCase,
    CreateDepositoUseCase,
    UpdateDepositoUseCase,
    CreateMotivoBloqueioSaldoUseCase,
    ListMotivosBloqueioSaldoUseCase,
    UpdateMotivoBloqueioSaldoUseCase,
    DeleteMotivoBloqueioSaldoUseCase,
    BloquearSaldoEnderecoUseCase,
    DesbloquearSaldoEnderecoUseCase,
    AjustarSaldoEnderecoUseCase,
    TransferirSaldoEnderecoUseCase,
    {
      provide: ESTOQUE_REPOSITORY,
      useClass: EstoqueService,
    },
    {
      provide: MOTIVO_BLOQUEIO_SALDO_REPOSITORY,
      useClass: MotivoBloqueioSaldoService,
    },
  ],
  exports: [
    EnsureDepositosUnidadeUseCase,
    ESTOQUE_REPOSITORY,
    MOTIVO_BLOQUEIO_SALDO_REPOSITORY,
  ],
})
export class EstoqueModule {}
