import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UpsertFaixasKmInputSchema } from '../../../domain/model/perfil-tarifa/perfil-tarifa.model.js';
import {
  PERFIL_TARIFA_REPOSITORY,
  type IPerfilTarifaRepository,
} from '../../../domain/repositories/perfil-tarifa/perfil-tarifa.repository.js';
import { mapPerfilTarifaToResponse } from '../../dtos/perfil-tarifa/map-perfil-tarifa-response.js';

function validateFaixasOverlap(
  faixas: Array<{ kmInicial: number; kmFinal?: number | null }>,
) {
  const sorted = [...faixas].sort((a, b) => a.kmInicial - b.kmInicial);

  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index]!;

    if (
      current.kmFinal !== undefined &&
      current.kmFinal !== null &&
      current.kmFinal <= current.kmInicial
    ) {
      throw new BadRequestException(
        'kmFinal deve ser maior que kmInicial em cada faixa',
      );
    }

    const next = sorted[index + 1];

    if (!next) {
      continue;
    }

    const currentEnd =
      current.kmFinal !== undefined && current.kmFinal !== null
        ? current.kmFinal
        : Number.POSITIVE_INFINITY;

    if (currentEnd >= next.kmInicial) {
      throw new BadRequestException('Faixas de km não podem se sobrepor');
    }
  }
}

@Injectable()
export class UpsertFaixasKmUseCase {
  constructor(
    @Inject(PERFIL_TARIFA_REPOSITORY)
    private readonly perfilTarifaRepository: IPerfilTarifaRepository,
  ) {}

  async execute(id: string, data: unknown) {
    const parsed = UpsertFaixasKmInputSchema.parse(data);

    const existing = await this.perfilTarifaRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Perfil tarifa "${id}" não encontrado`);
    }

    validateFaixasOverlap(parsed.faixas);

    const updated = await this.perfilTarifaRepository.upsertFaixasKm(
      id,
      parsed,
    );

    if (!updated) {
      throw new NotFoundException(`Perfil tarifa "${id}" não encontrado`);
    }

    return mapPerfilTarifaToResponse(updated);
  }
}
