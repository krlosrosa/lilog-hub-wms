import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  CENTRO_ORIGEM_REPOSITORY,
  type ICentroOrigemRepository,
} from '../../../domain/repositories/centro-origem/centro-origem.repository.js';

@Injectable()
export class GetCentroOrigemUseCase {
  constructor(
    @Inject(CENTRO_ORIGEM_REPOSITORY)
    private readonly centroOrigemRepository: ICentroOrigemRepository,
  ) {}

  async execute(centro: string) {
    const record = await this.centroOrigemRepository.findById(centro);

    if (!record) {
      throw new NotFoundException(`Centro de origem "${centro}" não encontrado`);
    }

    return record;
  }
}
