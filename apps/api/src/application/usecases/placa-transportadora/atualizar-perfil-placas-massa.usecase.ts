import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { AtualizarPerfilPlacasMassaInput } from '../../../domain/repositories/placa-transportadora/placa-transportadora.repository.js';
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
export class AtualizarPerfilPlacasMassaUseCase {
  constructor(
    @Inject(PLACA_TRANSPORTADORA_REPOSITORY)
    private readonly placaTransportadoraRepository: IPlacaTransportadoraRepository,
    @Inject(TRANSPORTADORA_REPOSITORY)
    private readonly transportadoraRepository: ITransportadoraRepository,
    @Inject(PERFIL_TARIFA_REPOSITORY)
    private readonly perfilTarifaRepository: IPerfilTarifaRepository,
  ) {}

  async execute(input: AtualizarPerfilPlacasMassaInput) {
    if (input.placaIds.length === 0) {
      throw new BadRequestException('Informe ao menos uma placa para atualizar');
    }

    const placas = await Promise.all(
      input.placaIds.map((placaId) =>
        this.placaTransportadoraRepository.findById(placaId),
      ),
    );

    const placasEncontradas = placas.filter(
      (placa): placa is NonNullable<typeof placa> => placa !== null,
    );

    if (placasEncontradas.length !== input.placaIds.length) {
      throw new NotFoundException('Uma ou mais placas informadas não foram encontradas');
    }

    const transportadoraIds = [
      ...new Set(placasEncontradas.map((placa) => placa.transportadoraId)),
    ];

    const transportadoras = await Promise.all(
      transportadoraIds.map((transportadoraId) =>
        this.transportadoraRepository.findById(transportadoraId),
      ),
    );

    if (transportadoras.some((transportadora) => !transportadora)) {
      throw new NotFoundException(
        'Transportadora de uma ou mais placas não encontrada',
      );
    }

    const unidadeIds = [
      ...new Set(
        transportadoras
          .filter(
            (transportadora): transportadora is NonNullable<typeof transportadora> =>
              transportadora !== null,
          )
          .map((transportadora) => transportadora.unidadeId),
      ),
    ];

    if (unidadeIds.length > 1) {
      throw new BadRequestException(
        'Todas as placas devem pertencer à mesma unidade para atualização em massa',
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

      if (perfil.unidadeId !== unidadeIds[0]) {
        throw new BadRequestException(
          'O perfil de tarifa deve pertencer à mesma unidade das placas',
        );
      }
    }

    return this.placaTransportadoraRepository.atualizarPerfilMassa(input);
  }
}
