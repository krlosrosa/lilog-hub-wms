import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { UpdatePerfilTarifaInputSchema } from '../../../domain/model/perfil-tarifa/perfil-tarifa.model.js';
import {
  PERFIL_TARIFA_REPOSITORY,
  type IPerfilTarifaRepository,
} from '../../../domain/repositories/perfil-tarifa/perfil-tarifa.repository.js';
import { mapPerfilTarifaToResponse } from '../../dtos/perfil-tarifa/map-perfil-tarifa-response.js';

@Injectable()
export class UpdatePerfilTarifaUseCase {
  constructor(
    @Inject(PERFIL_TARIFA_REPOSITORY)
    private readonly perfilTarifaRepository: IPerfilTarifaRepository,
  ) {}

  async execute(id: string, data: unknown) {
    const parsed = UpdatePerfilTarifaInputSchema.parse(data);

    const existing = await this.perfilTarifaRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Perfil tarifa "${id}" não encontrado`);
    }

    const updated = await this.perfilTarifaRepository.update(id, parsed);

    if (!updated) {
      throw new NotFoundException(`Perfil tarifa "${id}" não encontrado`);
    }

    return mapPerfilTarifaToResponse(updated);
  }
}
