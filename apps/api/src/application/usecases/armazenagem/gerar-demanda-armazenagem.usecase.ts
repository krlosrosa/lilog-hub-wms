import { Inject, Injectable } from '@nestjs/common';

import type { ModoUnitizacao } from '../../../domain/model/armazenagem/armazenagem.model.js';
import type { ItemAguardandoArmazenagem } from '../estoque/distribuir-saldo-recebimento-finalizado.usecase.js';
import {
  ARMAZENAGEM_REPOSITORY,
  type IArmazenagemRepository,
} from '../../../domain/repositories/armazenagem/armazenagem.repository.js';

export type GerarDemandaArmazenagemInput = {
  unidadeId: string;
  recebimentoId: string;
  modoUnitizacao: ModoUnitizacao | string;
  itens: ItemAguardandoArmazenagem[];
};

@Injectable()
export class GerarDemandaArmazenagemUseCase {
  constructor(
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
  ) {}

  async execute(input: GerarDemandaArmazenagemInput) {
    if (input.itens.length === 0) {
      return null;
    }

    const existing = await this.armazenagemRepository.findDemandaByRecebimentoId(
      input.recebimentoId,
    );

    if (existing) {
      return existing;
    }

    const demanda = await this.armazenagemRepository.criarDemanda({
      unidadeId: input.unidadeId,
      recebimentoId: input.recebimentoId,
      modoUnitizacao: input.modoUnitizacao as ModoUnitizacao,
      itens: input.itens.map((item) => ({
        unitizadorId: item.unitizadorId,
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        unidadeMedida: item.unidadeMedida,
        lote: item.lote,
        validade: item.validade,
        numeroSerie: item.numeroSerie,
      })),
    });

    const unitizadorIds = [
      ...new Set(
        input.itens
          .map((item) => item.unitizadorId)
          .filter((id): id is string => id !== null),
      ),
    ];

    await Promise.all(
      unitizadorIds.map((unitizadorId) =>
        this.armazenagemRepository.updateUnitizadorStatus(
          unitizadorId,
          'aguardando_armazenagem',
        ),
      ),
    );

    return demanda;
  }
}
