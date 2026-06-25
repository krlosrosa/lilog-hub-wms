import { Inject, Injectable } from '@nestjs/common';

import type { ListRecebimentosFilter } from '../../../domain/repositories/recebimento/recebimento.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';

@Injectable()
export class ListRecebimentosUseCase {
  constructor(
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
  ) {}

  execute(filter: ListRecebimentosFilter) {
    return this.recebimentoRepository.list(filter);
  }
}
