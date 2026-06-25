import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';

@Injectable()
export class GetRecebimentoUseCase {
  constructor(
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
  ) {}

  async execute(id: string) {
    const recebimento = await this.recebimentoRepository.findById(id);

    if (!recebimento) {
      throw new NotFoundException(`Recebimento "${id}" não encontrado`);
    }

    return recebimento;
  }
}
