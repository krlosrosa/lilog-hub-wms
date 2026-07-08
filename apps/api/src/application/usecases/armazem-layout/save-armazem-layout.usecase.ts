import { Inject, Injectable } from '@nestjs/common';

import { mapArmazemLayoutResponse } from '../../services/armazem-layout/map-armazem-layout-response.js';
import type { SaveArmazemLayoutInput } from '../../../domain/model/armazem-layout/armazem-layout.model.js';
import {
  ARMAZEM_LAYOUT_REPOSITORY,
  type IArmazemLayoutRepository,
} from '../../../domain/repositories/armazem-layout/armazem-layout.repository.js';

@Injectable()
export class SaveArmazemLayoutUseCase {
  constructor(
    @Inject(ARMAZEM_LAYOUT_REPOSITORY)
    private readonly armazemLayoutRepository: IArmazemLayoutRepository,
  ) {}

  async execute(input: SaveArmazemLayoutInput) {
    const saved = await this.armazemLayoutRepository.save(input);
    return mapArmazemLayoutResponse(saved);
  }
}
