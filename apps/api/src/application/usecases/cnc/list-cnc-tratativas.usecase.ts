import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  CNC_REPOSITORY,
  type ICncRepository,
} from '../../../domain/repositories/cnc/cnc.repository.js';

@Injectable()
export class ListCncTratativasUseCase {
  constructor(
    @Inject(CNC_REPOSITORY)
    private readonly cncRepository: ICncRepository,
  ) {}

  async execute(cncId: string) {
    const cnc = await this.cncRepository.findById(cncId);

    if (!cnc) {
      throw new NotFoundException(`CNC "${cncId}" não encontrada`);
    }

    return this.cncRepository.listTratativas(cncId);
  }
}
