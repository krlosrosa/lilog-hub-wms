import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  CNC_REPOSITORY,
  type ICncRepository,
} from '../../../domain/repositories/cnc/cnc.repository.js';

@Injectable()
export class GetCncUseCase {
  constructor(
    @Inject(CNC_REPOSITORY)
    private readonly cncRepository: ICncRepository,
  ) {}

  async execute(id: string) {
    const cnc = await this.cncRepository.findById(id);

    if (!cnc) {
      throw new NotFoundException(`CNC "${id}" não encontrada`);
    }

    return cnc;
  }
}
