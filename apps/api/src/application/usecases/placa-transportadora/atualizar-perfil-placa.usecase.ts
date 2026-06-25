import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { AtualizarPerfilPlacaInput } from '../../../domain/repositories/placa-transportadora/placa-transportadora.repository.js';
import {
  PLACA_TRANSPORTADORA_REPOSITORY,
  type IPlacaTransportadoraRepository,
} from '../../../domain/repositories/placa-transportadora/placa-transportadora.repository.js';
import {
  PERFIL_TARIFA_REPOSITORY,
  type IPerfilTarifaRepository,
} from '../../../domain/repositories/perfil-tarifa/perfil-tarifa.repository.js';
import {
  TRANSPORTADORA_REPOSITORY,
  type ITransportadoraRepository,
} from '../../../domain/repositories/transportadora/transportadora.repository.js';

@Injectable()
export class AtualizarPerfilPlacaUseCase {
  constructor(
    @Inject(PLACA_TRANSPORTADORA_REPOSITORY)
    private readonly placaTransportadoraRepository: IPlacaTransportadoraRepository,
    @Inject(TRANSPORTADORA_REPOSITORY)
    private readonly transportadoraRepository: ITransportadoraRepository,
    @Inject(PERFIL_TARIFA_REPOSITORY)
    private readonly perfilTarifaRepository: IPerfilTarifaRepository,
  ) {}

  async execute(input: AtualizarPerfilPlacaInput) {
    const placa = await this.placaTransportadoraRepository.findById(input.placaId);

    if (!placa) {
      throw new NotFoundException(`Placa "${input.placaId}" não encontrada`);
    }

    const transportadora = await this.transportadoraRepository.findById(
      placa.transportadoraId,
    );

    if (!transportadora) {
      throw new NotFoundException(
        `Transportadora da placa "${input.placaId}" não encontrada`,
      );
    }

    if (input.perfilTarifaId) {
      const perfil = await this.perfilTarifaRepository.findById(
        input.perfilTarifaId,
      );

      if (!perfil) {
        throw new NotFoundException(
          `Perfil de tarifa "${input.perfilTarifaId}" não encontrado`,
        );
      }

      if (perfil.unidadeId !== transportadora.unidadeId) {
        throw new BadRequestException(
          'O perfil de tarifa deve pertencer à mesma unidade da transportadora',
        );
      }
    }

    const atualizada = await this.placaTransportadoraRepository.atualizarPerfil(
      input,
    );

    if (!atualizada) {
      throw new NotFoundException(`Placa "${input.placaId}" não encontrada`);
    }

    return atualizada;
  }
}
