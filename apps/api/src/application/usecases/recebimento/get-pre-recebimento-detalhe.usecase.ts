import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';

@Injectable()
export class GetPreRecebimentoDetalheUseCase {
  constructor(
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
  ) {}

  async execute(id: string) {
    const detalhe = await this.preRecebimentoRepository.findDetalheById(id);

    if (!detalhe) {
      throw new NotFoundException(`Pré-recebimento "${id}" não encontrado`);
    }

    return detalhe;
  }
}
