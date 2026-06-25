import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  PERFIL_TARIFA_REPOSITORY,
  type IPerfilTarifaRepository,
} from '../../../domain/repositories/perfil-tarifa/perfil-tarifa.repository.js';

@Injectable()
export class DeletePerfilTarifaUseCase {
  constructor(
    @Inject(PERFIL_TARIFA_REPOSITORY)
    private readonly perfilTarifaRepository: IPerfilTarifaRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.perfilTarifaRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Perfil tarifa "${id}" não encontrado`);
    }

    await this.perfilTarifaRepository.delete(id);
  }
}
