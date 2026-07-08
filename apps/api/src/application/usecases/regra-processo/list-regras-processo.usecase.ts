import { Inject, Injectable } from '@nestjs/common';

import type { ListRegrasProcessoFilter } from '../../../domain/repositories/regra-processo/regra-processo.repository.js';
import {
  REGRA_PROCESSO_REPOSITORY,
  type IRegraProcessoRepository,
} from '../../../domain/repositories/regra-processo/regra-processo.repository.js';

@Injectable()
export class ListRegrasProcessoUseCase {
  constructor(
    @Inject(REGRA_PROCESSO_REPOSITORY)
    private readonly regraProcessoRepository: IRegraProcessoRepository,
  ) {}

  execute(filter: ListRegrasProcessoFilter) {
    return this.regraProcessoRepository.list(filter);
  }
}
