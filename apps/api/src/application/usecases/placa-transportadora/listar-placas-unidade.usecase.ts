import { Inject, Injectable } from '@nestjs/common';

import type { ListPlacasUnidadeFilter } from '../../../domain/repositories/placa-transportadora/placa-transportadora.repository.js';
import {
  PLACA_TRANSPORTADORA_REPOSITORY,
  type IPlacaTransportadoraRepository,
} from '../../../domain/repositories/placa-transportadora/placa-transportadora.repository.js';

@Injectable()
export class ListarPlacasUnidadeUseCase {
  constructor(
    @Inject(PLACA_TRANSPORTADORA_REPOSITORY)
    private readonly placaTransportadoraRepository: IPlacaTransportadoraRepository,
  ) {}

  execute(filter: ListPlacasUnidadeFilter) {
    return this.placaTransportadoraRepository.listByUnidade(filter);
  }
}
