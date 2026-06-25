import { Inject, Injectable } from '@nestjs/common';

import { mapListCortesToDto } from '../../mappers/corte-operacional/corte-operacional.mapper.js';
import type { ListCortesResponseDto } from '../../dtos/corte-operacional/corte-operacional.dto.js';
import type { ListCortesInput } from '../../../domain/model/corte-operacional/corte-operacional.model.js';
import {
  CORTE_OPERACIONAL_REPOSITORY,
  type ICorteOperacionalRepository,
} from '../../../domain/repositories/corte-operacional/corte-operacional.repository.js';

@Injectable()
export class ListCortesUseCase {
  constructor(
    @Inject(CORTE_OPERACIONAL_REPOSITORY)
    private readonly corteOperacionalRepository: ICorteOperacionalRepository,
  ) {}

  async execute(input: ListCortesInput): Promise<ListCortesResponseDto> {
    const result = await this.corteOperacionalRepository.listCortes(input);

    return mapListCortesToDto({
      ...result,
      page: input.page,
      limit: input.limit,
    });
  }
}
