import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { mapCorteDetalheToDto } from '../../mappers/corte-operacional/corte-operacional.mapper.js';
import type { CorteDetalheResponseDto } from '../../dtos/corte-operacional/corte-operacional.dto.js';
import type { CancelarCorteInput } from '../../../domain/model/corte-operacional/corte-operacional.model.js';
import {
  CORTE_OPERACIONAL_REPOSITORY,
  type ICorteOperacionalRepository,
} from '../../../domain/repositories/corte-operacional/corte-operacional.repository.js';

@Injectable()
export class CancelarCorteUseCase {
  constructor(
    @Inject(CORTE_OPERACIONAL_REPOSITORY)
    private readonly corteOperacionalRepository: ICorteOperacionalRepository,
  ) {}

  async execute(input: CancelarCorteInput): Promise<CorteDetalheResponseDto> {
    const atual = await this.corteOperacionalRepository.findCorteById(
      input.corteId,
      input.unidadeId,
    );

    if (!atual) {
      throw new NotFoundException('Corte operacional não encontrado');
    }

    if (atual.status !== 'solicitado' && atual.status !== 'em_andamento') {
      throw new BadRequestException(
        'Somente cortes solicitados ou em andamento podem ser cancelados',
      );
    }

    const corte = await this.corteOperacionalRepository.cancelarCorte(input);

    if (!corte) {
      throw new NotFoundException('Corte operacional não encontrado');
    }

    return mapCorteDetalheToDto(corte);
  }
}
