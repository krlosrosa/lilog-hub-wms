import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { UpsertTemperaturaProdutoRecebimentoInput } from '../../../domain/model/recebimento/recebimento.model.js';
import {
  CONFERENCIA_REPOSITORY,
  type IConferenciaRepository,
} from '../../../domain/repositories/recebimento/conferencia.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';

@Injectable()
export class UpsertTemperaturaProdutoRecebimentoUseCase {
  constructor(
    @Inject(CONFERENCIA_REPOSITORY)
    private readonly conferenciaRepository: IConferenciaRepository,
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
  ) {}

  async execute(input: {
    recebimentoId: string;
    data: UpsertTemperaturaProdutoRecebimentoInput;
    operatorId: number | null;
  }) {
    const recebimento = await this.recebimentoRepository.findById(
      input.recebimentoId,
    );

    if (!recebimento) {
      throw new NotFoundException(
        `Recebimento "${input.recebimentoId}" não encontrado`,
      );
    }

    const record = await this.conferenciaRepository.upsertTemperaturaProduto(
      input.recebimentoId,
      input.data,
      input.operatorId,
    );

    return {
      id: record.id,
      recebimentoId: record.recebimentoId,
      etapa: record.etapa,
      temperatura: record.temperatura,
      medidoEm: record.medidoEm.toISOString(),
    };
  }
}
