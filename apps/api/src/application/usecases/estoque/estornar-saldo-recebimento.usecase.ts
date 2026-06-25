import { Inject, Injectable } from '@nestjs/common';

import { buildPreRecebimentoDocumentoRef } from '../../../domain/model/estoque/deposito.model.js';
import {
  ESTOQUE_REPOSITORY,
  type IEstoqueRepository,
} from '../../../domain/repositories/estoque/estoque.repository.js';
import { MovimentarEstoqueUseCase } from './movimentar-estoque.usecase.js';

export type EstornarSaldoRecebimentoInput = {
  unidadeId: string;
  preRecebimentoId: string;
  operatorId: number | null;
};

@Injectable()
export class EstornarSaldoRecebimentoUseCase {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
    private readonly movimentarEstoqueUseCase: MovimentarEstoqueUseCase,
  ) {}

  async execute(input: EstornarSaldoRecebimentoInput) {
    const deposito = await this.estoqueRepository.findDepositoByCodigo(
      input.unidadeId,
      'TRANSF',
    );

    if (!deposito) {
      return [];
    }

    return this.movimentarEstoqueUseCase.estornarPorDocumento({
      unidadeId: input.unidadeId,
      depositoId: deposito.id,
      documentoRef: buildPreRecebimentoDocumentoRef(input.preRecebimentoId),
      motivo: 'recebimento_cancelado',
      operatorId: input.operatorId,
    });
  }
}
