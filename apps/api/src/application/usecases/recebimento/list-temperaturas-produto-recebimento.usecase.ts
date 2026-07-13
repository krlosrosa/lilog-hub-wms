import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  CONFERENCIA_REPOSITORY,
  type IConferenciaRepository,
} from '../../../domain/repositories/recebimento/conferencia.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';

@Injectable()
export class ListTemperaturasProdutoRecebimentoUseCase {
  constructor(
    @Inject(CONFERENCIA_REPOSITORY)
    private readonly conferenciaRepository: IConferenciaRepository,
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
  ) {}

  async execute(recebimentoId: string) {
    const recebimento =
      await this.recebimentoRepository.findById(recebimentoId);

    if (!recebimento) {
      throw new NotFoundException(
        `Recebimento "${recebimentoId}" não encontrado`,
      );
    }

    const items =
      await this.conferenciaRepository.listTemperaturasProduto(recebimentoId);

    return {
      recebimentoId,
      items: items.map((item) => ({
        etapa: item.etapa,
        temperatura: item.temperatura,
        medidoEm: item.medidoEm.toISOString(),
      })),
    };
  }
}
