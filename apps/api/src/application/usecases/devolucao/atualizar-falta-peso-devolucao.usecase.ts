import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { mapFaltaPesoToResponse } from '../../services/devolucao/map-falta-peso-response.js';
import type { ValidarFaltaPesoResponseDto } from '../../dtos/devolucao/falta-peso-devolucao.dto.js';
import {
  DEVOLUCAO_REPOSITORY,
  type AtualizarFaltaPesoInput,
  type IDevolucaoRepository,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import { FaltaPesoDevolucaoValidationError } from '../../../infra/db/devolucao/registrar-falta-peso.drizzle.js';

@Injectable()
export class AtualizarFaltaPesoDevolucaoUseCase {
  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
  ) {}

  async execute(
    input: AtualizarFaltaPesoInput,
  ): Promise<ValidarFaltaPesoResponseDto> {
    if (input.diferencaKg <= 0) {
      throw new BadRequestException(
        'A diferença de peso deve ser maior que zero.',
      );
    }

    try {
      const result = await this.devolucaoRepository.atualizarFaltaPeso(input);

      if (!result) {
        throw new NotFoundException('Falta de peso não encontrada.');
      }

      return mapFaltaPesoToResponse(result);
    } catch (error) {
      if (error instanceof FaltaPesoDevolucaoValidationError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
