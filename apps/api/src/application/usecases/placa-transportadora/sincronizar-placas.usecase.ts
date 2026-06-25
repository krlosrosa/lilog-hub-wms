import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { SyncPlacaTransportadoraInput } from '../../../domain/repositories/placa-transportadora/placa-transportadora.repository.js';
import {
  PLACA_TRANSPORTADORA_REPOSITORY,
  type IPlacaTransportadoraRepository,
} from '../../../domain/repositories/placa-transportadora/placa-transportadora.repository.js';
import {
  TRANSPORTADORA_REPOSITORY,
  type ITransportadoraRepository,
} from '../../../domain/repositories/transportadora/transportadora.repository.js';
import { RavexVeiculoClient } from '../../../infra/clients/ravex/ravex-veiculo.client.js';
import type { RavexVeiculo } from '../../../infra/clients/ravex/ravex-veiculo.types.js';

function mapRavexVeiculoToSyncInput(
  veiculo: RavexVeiculo,
): SyncPlacaTransportadoraInput {
  return {
    idRavexVeiculo: veiculo.id,
    placa: veiculo.placa,
    tipoVeiculoIdRavex: veiculo.tipoVeiculo?.id ?? null,
    tipoVeiculoNome: veiculo.tipoVeiculo?.nome ?? null,
    peso:
      veiculo.tipoVeiculo?.peso != null
        ? String(veiculo.tipoVeiculo.peso)
        : null,
    cubagem:
      veiculo.tipoVeiculo?.cubagem != null
        ? String(veiculo.tipoVeiculo.cubagem)
        : null,
    tara:
      veiculo.tipoVeiculo?.tara != null
        ? String(veiculo.tipoVeiculo.tara)
        : null,
    estrangeiro: veiculo.estrangeiro ?? false,
  };
}

@Injectable()
export class SincronizarPlacasUseCase {
  constructor(
    @Inject(PLACA_TRANSPORTADORA_REPOSITORY)
    private readonly placaTransportadoraRepository: IPlacaTransportadoraRepository,
    @Inject(TRANSPORTADORA_REPOSITORY)
    private readonly transportadoraRepository: ITransportadoraRepository,
    private readonly ravexVeiculoClient: RavexVeiculoClient,
  ) {}

  async execute(transportadoraId: string) {
    const transportadora =
      await this.transportadoraRepository.findById(transportadoraId);

    if (!transportadora) {
      throw new NotFoundException(
        `Transportadora "${transportadoraId}" não encontrada`,
      );
    }

    const veiculos =
      await this.ravexVeiculoClient.listVeiculosPorTransportadoraId(
        transportadora.idRavexTransportadora,
      );

    const syncResult = await this.placaTransportadoraRepository.syncFromRavex({
      transportadoraId,
      placas: veiculos.map(mapRavexVeiculoToSyncInput),
    });

    await this.transportadoraRepository.update(transportadoraId, {
      quantidadeVeiculos: syncResult.total,
    });

    return {
      items: syncResult.items,
      total: syncResult.total,
      page: 1,
      limit: syncResult.total,
      inseridas: syncResult.inseridas,
      atualizadas: syncResult.atualizadas,
      removidas: syncResult.removidas,
    };
  }
}
