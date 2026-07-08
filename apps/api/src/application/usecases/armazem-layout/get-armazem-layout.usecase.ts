import { Inject, Injectable } from '@nestjs/common';

import { mapArmazemLayoutResponse } from '../../services/armazem-layout/map-armazem-layout-response.js';
import {
  ARMAZEM_LAYOUT_REPOSITORY,
  type IArmazemLayoutRepository,
} from '../../../domain/repositories/armazem-layout/armazem-layout.repository.js';

@Injectable()
export class GetArmazemLayoutUseCase {
  constructor(
    @Inject(ARMAZEM_LAYOUT_REPOSITORY)
    private readonly armazemLayoutRepository: IArmazemLayoutRepository,
  ) {}

  async execute(unidadeId: string) {
    const layout = await this.armazemLayoutRepository.findByUnidadeId(unidadeId);

    if (!layout) {
      return null;
    }

    return mapArmazemLayoutResponse(layout);
  }
}
