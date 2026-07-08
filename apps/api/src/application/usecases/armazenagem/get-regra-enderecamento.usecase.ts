import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  REGRA_ENDERECAMENTO_REPOSITORY,
  type IRegraEnderecamentoRepository,
} from '../../../domain/repositories/armazenagem/regra-enderecamento.repository.js';

@Injectable()
export class GetRegraEnderecamentoUseCase {
  constructor(
    @Inject(REGRA_ENDERECAMENTO_REPOSITORY)
    private readonly regraEnderecamentoRepository: IRegraEnderecamentoRepository,
  ) {}

  async execute(id: string) {
    const regra = await this.regraEnderecamentoRepository.findById(id);

    if (!regra) {
      throw new NotFoundException(`Regra de endereçamento "${id}" não encontrada`);
    }

    return regra;
  }
}
