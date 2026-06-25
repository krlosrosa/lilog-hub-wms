import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';

@Injectable()
export class GetPreRecebimentoUseCase {
  constructor(
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
  ) {}

  async execute(id: string) {
    const preRecebimento = await this.preRecebimentoRepository.findById(id);

    if (!preRecebimento) {
      throw new NotFoundException(`Pré-recebimento "${id}" não encontrado`);
    }

    return preRecebimento;
  }
}
