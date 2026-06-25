import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import type { BuscarPlacasUnidadeFilter } from '../../../domain/repositories/placa-transportadora/placa-transportadora.repository.js';
import {
  PLACA_TRANSPORTADORA_REPOSITORY,
  type IPlacaTransportadoraRepository,
} from '../../../domain/repositories/placa-transportadora/placa-transportadora.repository.js';

const MAX_PLACAS_POR_BUSCA = 200;

function normalizarPlaca(placa: string): string {
  const raw = placa.trim().toUpperCase();
  if (!raw) {
    return '';
  }

  const semSufixoUf = raw.split('-')[0] ?? raw;
  return semSufixoUf.slice(0, 7);
}

@Injectable()
export class BuscarPlacasUnidadeUseCase {
  constructor(
    @Inject(PLACA_TRANSPORTADORA_REPOSITORY)
    private readonly placaTransportadoraRepository: IPlacaTransportadoraRepository,
  ) {}

  execute(input: BuscarPlacasUnidadeFilter) {
    const placas = [
      ...new Set(
        input.placas.map(normalizarPlaca).filter((placa) => placa.length > 0),
      ),
    ];

    if (placas.length === 0) {
      throw new BadRequestException('Informe ao menos uma placa para buscar');
    }

    if (placas.length > MAX_PLACAS_POR_BUSCA) {
      throw new BadRequestException(
        `É permitido buscar no máximo ${MAX_PLACAS_POR_BUSCA} placas por requisição`,
      );
    }

    return this.placaTransportadoraRepository.buscarByPlacasUnidade({
      unidadeId: input.unidadeId,
      placas,
    });
  }
}
