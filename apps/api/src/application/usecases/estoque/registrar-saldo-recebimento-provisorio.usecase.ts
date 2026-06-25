import { Inject, Injectable } from '@nestjs/common';

import { buildPreRecebimentoDocumentoRef } from '../../../domain/model/estoque/deposito.model.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';
import type { ItemPreRecebimentoRecord } from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import { toBaseUnits } from '../../../domain/services/unidade-medida.js';
import { EnsureDepositosUnidadeUseCase } from './ensure-depositos-unidade.usecase.js';
import { MovimentarEstoqueUseCase } from './movimentar-estoque.usecase.js';

export type RegistrarSaldoRecebimentoProvisorioInput = {
  unidadeId: string;
  preRecebimentoId: string;
  itensEsperados: ItemPreRecebimentoRecord[];
  operatorId: number | null;
};

@Injectable()
export class RegistrarSaldoRecebimentoProvisorioUseCase {
  constructor(
    private readonly ensureDepositosUnidadeUseCase: EnsureDepositosUnidadeUseCase,
    private readonly movimentarEstoqueUseCase: MovimentarEstoqueUseCase,
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
  ) {}

  async execute(input: RegistrarSaldoRecebimentoProvisorioInput) {
    await this.ensureDepositosUnidadeUseCase.execute(input.unidadeId);

    const deposito = await this.estoqueRepository.findDepositoByCodigo(
      input.unidadeId,
      'TRANSF',
    );

    if (!deposito) {
      throw new Error('Depósito TRANSF não encontrado');
    }

    const documentoRef = buildPreRecebimentoDocumentoRef(
      input.preRecebimentoId,
    );

    const saldosAtuais =
      await this.estoqueRepository.getNetSaldoTransfPorDocumento(
        input.unidadeId,
        deposito.id,
        documentoRef,
      );

    const quantidadeAtualPorProduto = new Map<string, number>();

    for (const saldo of saldosAtuais) {
      quantidadeAtualPorProduto.set(
        saldo.produtoId,
        (quantidadeAtualPorProduto.get(saldo.produtoId) ?? 0) + saldo.quantidade,
      );
    }

    for (const item of input.itensEsperados) {
      const quantidadeUN = toBaseUnits(
        item.quantidadeEsperada,
        item.unidadeMedida,
        item.unidadesPorCaixa,
      );

      if (quantidadeUN <= 0) {
        continue;
      }

      const quantidadeAtual = quantidadeAtualPorProduto.get(item.produtoId) ?? 0;
      const delta = quantidadeUN - quantidadeAtual;

      if (delta <= 0) {
        continue;
      }

      await this.movimentarEstoqueUseCase.registrarEntrada({
        unidadeId: input.unidadeId,
        depositoId: deposito.id,
        produtoId: item.produtoId,
        quantidade: delta,
        unidadeMedida: 'UN',
        documentoRef,
        motivo: 'recebimento_provisorio',
        operatorId: input.operatorId,
      });
    }
  }
}
