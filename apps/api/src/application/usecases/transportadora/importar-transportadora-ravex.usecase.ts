import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ImportarTransportadoraRavexInputSchema,
  normalizeCnpjDigits,
  type ImportarTransportadoraRavexInput,
} from '../../../domain/model/transportadora/transportadora.model.js';
import {
  TRANSPORTADORA_REPOSITORY,
  type ITransportadoraRepository,
} from '../../../domain/repositories/transportadora/transportadora.repository.js';
import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';
import { RavexVeiculoClient } from '../../../infra/clients/ravex/ravex-veiculo.client.js';

@Injectable()
export class ImportarTransportadoraRavexUseCase {
  constructor(
    @Inject(TRANSPORTADORA_REPOSITORY)
    private readonly transportadoraRepository: ITransportadoraRepository,
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
    private readonly ravexVeiculoClient: RavexVeiculoClient,
  ) {}

  async execute(data: ImportarTransportadoraRavexInput) {
    const parsed = ImportarTransportadoraRavexInputSchema.parse(data);

    const unidade = await this.unidadeRepository.findById(parsed.unidadeId);

    if (!unidade) {
      throw new NotFoundException(
        `Unidade "${parsed.unidadeId}" não encontrada`,
      );
    }

    const veiculos = await this.ravexVeiculoClient.getTransportadoraPorId(
      parsed.idRavexTransportadora,
    );

    const existing =
      await this.transportadoraRepository.findByUnidadeAndRavexId(
        parsed.unidadeId,
        parsed.idRavexTransportadora,
      );

    if (existing) {
      const updated = await this.transportadoraRepository.update(existing.id, {
        nome: veiculos.nome,
        cnpj: normalizeCnpjDigits(veiculos.cnpj),
        quantidadeVeiculos: veiculos.quantidadeVeiculos,
      });

      return updated!;
    }

    return this.transportadoraRepository.create({
      unidadeId: parsed.unidadeId,
      idRavexTransportadora: veiculos.id,
      nome: veiculos.nome,
      cnpj: veiculos.cnpj,
      status: 'ativa',
      quantidadeVeiculos: veiculos.quantidadeVeiculos,
      emails: [],
    });
  }
}
