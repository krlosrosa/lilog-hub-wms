import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { normalizeCnpjDigits } from '../../../domain/model/transportadora/transportadora.model.js';
import {
  TRANSPORTADORA_REPOSITORY,
  type ITransportadoraRepository,
} from '../../../domain/repositories/transportadora/transportadora.repository.js';
import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';
import { RavexVeiculoClient } from '../../../infra/clients/ravex/ravex-veiculo.client.js';

type BuscarTransportadoraPorPlacaInput = {
  unidadeId: string;
  placa: string;
};

@Injectable()
export class BuscarTransportadoraPorPlacaUseCase {
  constructor(
    @Inject(TRANSPORTADORA_REPOSITORY)
    private readonly transportadoraRepository: ITransportadoraRepository,
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
    private readonly ravexVeiculoClient: RavexVeiculoClient,
  ) {}

  async execute(data: BuscarTransportadoraPorPlacaInput) {
    const unidade = await this.unidadeRepository.findById(data.unidadeId);

    if (!unidade) {
      throw new NotFoundException(
        `Unidade "${data.unidadeId}" não encontrada`,
      );
    }

    const veiculo = await this.ravexVeiculoClient.getVeiculoPorPlaca(data.placa);

    const ravex = await this.ravexVeiculoClient.getTransportadoraPorId(
      veiculo.transportadora.id,
    );

    const existing =
      await this.transportadoraRepository.findByUnidadeAndRavexId(
        data.unidadeId,
        ravex.id,
      );

    return {
      idRavexTransportadora: ravex.id,
      nome: ravex.nome,
      cnpj: normalizeCnpjDigits(ravex.cnpj),
      quantidadeVeiculos: ravex.quantidadeVeiculos,
      jaCadastrada: Boolean(existing),
      transportadoraExistenteId: existing?.id ?? null,
    };
  }
}
