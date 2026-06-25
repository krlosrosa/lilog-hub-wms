import { Inject, Injectable } from '@nestjs/common';

import type { ListTransportadorasFilter } from '../../../domain/repositories/transportadora/transportadora.repository.js';
import {
  TRANSPORTADORA_REPOSITORY,
  type ITransportadoraRepository,
} from '../../../domain/repositories/transportadora/transportadora.repository.js';

@Injectable()
export class ListTransportadorasUseCase {
  constructor(
    @Inject(TRANSPORTADORA_REPOSITORY)
    private readonly transportadoraRepository: ITransportadoraRepository,
  ) {}

  execute(filter: ListTransportadorasFilter) {
    return this.transportadoraRepository.list(filter);
  }
}
