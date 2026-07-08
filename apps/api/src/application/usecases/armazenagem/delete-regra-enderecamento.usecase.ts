import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  REGRA_ENDERECAMENTO_REPOSITORY,
  type IRegraEnderecamentoRepository,
} from '../../../domain/repositories/armazenagem/regra-enderecamento.repository.js';

@Injectable()
export class DeleteRegraEnderecamentoUseCase {
  constructor(
    @Inject(REGRA_ENDERECAMENTO_REPOSITORY)
    private readonly regraEnderecamentoRepository: IRegraEnderecamentoRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.regraEnderecamentoRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Regra "${id}" não encontrada`);
    }

    await this.regraEnderecamentoRepository.delete(id);
  }
}
