import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  REGRA_PROCESSO_REPOSITORY,
  type IRegraProcessoRepository,
} from '../../../domain/repositories/regra-processo/regra-processo.repository.js';

@Injectable()
export class DeleteRegraProcessoUseCase {
  constructor(
    @Inject(REGRA_PROCESSO_REPOSITORY)
    private readonly regraProcessoRepository: IRegraProcessoRepository,
  ) {}

  async execute(id: string) {
    const current = await this.regraProcessoRepository.findById(id);

    if (!current) {
      throw new NotFoundException(`Regra "${id}" não encontrada`);
    }

    await this.regraProcessoRepository.delete(id);
  }
}
