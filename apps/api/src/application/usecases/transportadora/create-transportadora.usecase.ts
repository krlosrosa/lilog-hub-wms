import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { z } from 'zod';

import {
  CreateTransportadoraInputSchema,
} from '../../../domain/model/transportadora/transportadora.model.js';
import {
  TRANSPORTADORA_REPOSITORY,
  type ITransportadoraRepository,
} from '../../../domain/repositories/transportadora/transportadora.repository.js';
import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';
import { SincronizarPlacasUseCase } from '../placa-transportadora/sincronizar-placas.usecase.js';

const CreateTransportadoraCommandSchema = CreateTransportadoraInputSchema.extend({
  sincronizarPlacas: z.boolean().optional().default(false),
});

@Injectable()
export class CreateTransportadoraUseCase {
  constructor(
    @Inject(TRANSPORTADORA_REPOSITORY)
    private readonly transportadoraRepository: ITransportadoraRepository,
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
    private readonly sincronizarPlacasUseCase: SincronizarPlacasUseCase,
  ) {}

  async execute(data: unknown) {
    const parsed = CreateTransportadoraCommandSchema.parse(data);
    const { sincronizarPlacas, ...createInput } = parsed;

    const unidade = await this.unidadeRepository.findById(createInput.unidadeId);

    if (!unidade) {
      throw new NotFoundException(
        `Unidade "${createInput.unidadeId}" não encontrada`,
      );
    }

    const existing =
      await this.transportadoraRepository.findByUnidadeAndRavexId(
        createInput.unidadeId,
        createInput.idRavexTransportadora,
      );

    if (existing) {
      throw new ConflictException(
        `Transportadora com ID Ravex ${createInput.idRavexTransportadora} já existe nesta unidade`,
      );
    }

    const transportadora = await this.transportadoraRepository.create(createInput);

    if (!sincronizarPlacas) {
      return transportadora;
    }

    await this.sincronizarPlacasUseCase.execute(transportadora.id);

    const atualizada = await this.transportadoraRepository.findById(
      transportadora.id,
    );

    return atualizada ?? transportadora;
  }
}
