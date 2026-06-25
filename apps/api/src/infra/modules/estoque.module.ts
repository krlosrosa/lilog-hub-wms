import { Module } from '@nestjs/common';

import { DistribuirSaldoRecebimentoFinalizadoUseCase } from '../../application/usecases/estoque/distribuir-saldo-recebimento-finalizado.usecase.js';
import { EnsureDepositosUnidadeUseCase } from '../../application/usecases/estoque/ensure-depositos-unidade.usecase.js';
import { EstornarSaldoRecebimentoUseCase } from '../../application/usecases/estoque/estornar-saldo-recebimento.usecase.js';
import { ListDepositosUseCase } from '../../application/usecases/estoque/list-depositos.usecase.js';
import { ListSaldosUseCase } from '../../application/usecases/estoque/list-saldos.usecase.js';
import { MovimentarEstoqueUseCase } from '../../application/usecases/estoque/movimentar-estoque.usecase.js';
import { ReconciliarSaldoRecebimentoUseCase } from '../../application/usecases/estoque/reconciliar-saldo-recebimento.usecase.js';
import { RegistrarSaldoRecebimentoProvisorioUseCase } from '../../application/usecases/estoque/registrar-saldo-recebimento-provisorio.usecase.js';
import { ESTOQUE_REPOSITORY } from '../../domain/repositories/estoque/estoque.repository.js';
import { ListDepositosController } from '../../presentation/controllers/estoque/list-depositos.controller.js';
import { ListSaldosController } from '../../presentation/controllers/estoque/list-saldos.controller.js';
import { EstoqueService } from '../db/estoque/estoque.service.js';
import { AuthModule } from './auth.module.js';
import { ProdutoModule } from './produto.module.js';

@Module({
  imports: [AuthModule, ProdutoModule],
  controllers: [ListDepositosController, ListSaldosController],
  providers: [
    MovimentarEstoqueUseCase,
    EnsureDepositosUnidadeUseCase,
    ListDepositosUseCase,
    ListSaldosUseCase,
    RegistrarSaldoRecebimentoProvisorioUseCase,
    ReconciliarSaldoRecebimentoUseCase,
    DistribuirSaldoRecebimentoFinalizadoUseCase,
    EstornarSaldoRecebimentoUseCase,
    {
      provide: ESTOQUE_REPOSITORY,
      useClass: EstoqueService,
    },
  ],
  exports: [
    MovimentarEstoqueUseCase,
    EnsureDepositosUnidadeUseCase,
    RegistrarSaldoRecebimentoProvisorioUseCase,
    ReconciliarSaldoRecebimentoUseCase,
    DistribuirSaldoRecebimentoFinalizadoUseCase,
    EstornarSaldoRecebimentoUseCase,
    ESTOQUE_REPOSITORY,
  ],
})
export class EstoqueModule {}
