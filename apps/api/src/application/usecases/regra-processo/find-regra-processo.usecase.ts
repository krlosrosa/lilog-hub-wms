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
export class FindRegraProcessoUseCase {
  constructor(
    @Inject(REGRA_PROCESSO_REPOSITORY)
    private readonly regraProcessoRepository: IRegraProcessoRepository,
  ) {}

  async execute(id: string) {
    const regra = await this.regraProcessoRepository.findById(id);

    if (!regra) {
      throw new NotFoundException(`Regra "${id}" não encontrada`);
    }

    return regra;
  }
}
