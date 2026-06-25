import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { ListPlacasTransportadoraFilter } from '../../../domain/repositories/placa-transportadora/placa-transportadora.repository.js';
import {
  PLACA_TRANSPORTADORA_REPOSITORY,
  type IPlacaTransportadoraRepository,
} from '../../../domain/repositories/placa-transportadora/placa-transportadora.repository.js';
import {
  TRANSPORTADORA_REPOSITORY,
  type ITransportadoraRepository,
} from '../../../domain/repositories/transportadora/transportadora.repository.js';

@Injectable()
export class ListarPlacasUseCase {
  constructor(
    @Inject(PLACA_TRANSPORTADORA_REPOSITORY)
    private readonly placaTransportadoraRepository: IPlacaTransportadoraRepository,
    @Inject(TRANSPORTADORA_REPOSITORY)
    private readonly transportadoraRepository: ITransportadoraRepository,
  ) {}

  async execute(filter: ListPlacasTransportadoraFilter) {
    const transportadora = await this.transportadoraRepository.findById(
      filter.transportadoraId,
    );

    if (!transportadora) {
      throw new NotFoundException(
        `Transportadora "${filter.transportadoraId}" não encontrada`,
      );
    }

    return this.placaTransportadoraRepository.list(filter);
  }
}
