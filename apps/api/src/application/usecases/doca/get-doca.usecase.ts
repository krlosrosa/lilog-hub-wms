import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  DOCA_REPOSITORY,
  type IDocaRepository,
} from '../../../domain/repositories/doca/doca.repository.js';

@Injectable()
export class GetDocaUseCase {
  constructor(
    @Inject(DOCA_REPOSITORY)
    private readonly docaRepository: IDocaRepository,
  ) {}

  async execute(id: string) {
    const doca = await this.docaRepository.findById(id);

    if (!doca) {
      throw new NotFoundException(`Doca "${id}" não encontrada`);
    }

    return doca;
  }
}
