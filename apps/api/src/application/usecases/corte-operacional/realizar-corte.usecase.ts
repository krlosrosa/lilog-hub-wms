import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { mapCorteDetalheToDto } from '../../mappers/corte-operacional/corte-operacional.mapper.js';
import type { CorteDetalheResponseDto } from '../../dtos/corte-operacional/corte-operacional.dto.js';
import type { TransicaoCorteInput } from '../../../domain/model/corte-operacional/corte-operacional.model.js';
import {
  CORTE_OPERACIONAL_REPOSITORY,
  type ICorteOperacionalRepository,
} from '../../../domain/repositories/corte-operacional/corte-operacional.repository.js';

@Injectable()
export class RealizarCorteUseCase {
  constructor(
    @Inject(CORTE_OPERACIONAL_REPOSITORY)
    private readonly corteOperacionalRepository: ICorteOperacionalRepository,
  ) {}

  async execute(input: TransicaoCorteInput): Promise<CorteDetalheResponseDto> {
    const atual = await this.corteOperacionalRepository.findCorteById(
      input.corteId,
      input.unidadeId,
    );

    if (!atual) {
      throw new NotFoundException('Corte operacional não encontrado');
    }

    if (atual.status !== 'em_andamento') {
      throw new BadRequestException(
        'Somente cortes em andamento podem ser concluídos',
      );
    }

    const corte = await this.corteOperacionalRepository.realizarCorte(input);

    if (!corte) {
      throw new NotFoundException('Corte operacional não encontrado');
    }

    return mapCorteDetalheToDto(corte);
  }
}
