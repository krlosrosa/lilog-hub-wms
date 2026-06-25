import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreatePerfilTarifaInputSchema } from '../../../domain/model/perfil-tarifa/perfil-tarifa.model.js';
import {
  PERFIL_TARIFA_REPOSITORY,
  type IPerfilTarifaRepository,
} from '../../../domain/repositories/perfil-tarifa/perfil-tarifa.repository.js';
import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';
import { mapPerfilTarifaToResponse } from '../../dtos/perfil-tarifa/map-perfil-tarifa-response.js';

@Injectable()
export class CreatePerfilTarifaUseCase {
  constructor(
    @Inject(PERFIL_TARIFA_REPOSITORY)
    private readonly perfilTarifaRepository: IPerfilTarifaRepository,
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
  ) {}

  async execute(data: unknown) {
    const parsed = CreatePerfilTarifaInputSchema.parse(data);

    const unidade = await this.unidadeRepository.findById(parsed.unidadeId);

    if (!unidade) {
      throw new NotFoundException(
        `Unidade "${parsed.unidadeId}" não encontrada`,
      );
    }

    const existing = await this.perfilTarifaRepository.findByUnidadeAndRavexId(
      parsed.unidadeId,
      parsed.idRavex,
    );

    if (existing) {
      throw new ConflictException(
        `Perfil com ID Ravex ${parsed.idRavex} já existe nesta unidade`,
      );
    }

    const created = await this.perfilTarifaRepository.create(parsed);

    return mapPerfilTarifaToResponse(created);
  }
}
