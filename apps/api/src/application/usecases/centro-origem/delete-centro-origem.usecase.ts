import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  CENTRO_ORIGEM_REPOSITORY,
  type ICentroOrigemRepository,
} from '../../../domain/repositories/centro-origem/centro-origem.repository.js';

@Injectable()
export class DeleteCentroOrigemUseCase {
  constructor(
    @Inject(CENTRO_ORIGEM_REPOSITORY)
    private readonly centroOrigemRepository: ICentroOrigemRepository,
  ) {}

  async execute(centro: string) {
    const existing = await this.centroOrigemRepository.findById(centro);

    if (!existing) {
      throw new NotFoundException(`Centro de origem "${centro}" não encontrado`);
    }

    await this.centroOrigemRepository.delete(centro);
  }
}
