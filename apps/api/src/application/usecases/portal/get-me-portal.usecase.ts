import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  TRANSPORTADORA_REPOSITORY,
  type ITransportadoraRepository,
} from '../../../domain/repositories/transportadora/transportadora.repository.js';

export type GetMePortalInput = {
  email: string;
  transportadoraId: string;
};

export type GetMePortalOutput = {
  email: string;
  transportadoraId: string;
  transportadoraNome: string;
};

@Injectable()
export class GetMePortalUseCase {
  constructor(
    @Inject(TRANSPORTADORA_REPOSITORY)
    private readonly transportadoraRepository: ITransportadoraRepository,
  ) {}

  async execute(input: GetMePortalInput): Promise<GetMePortalOutput> {
    const transportadora = await this.transportadoraRepository.findById(
      input.transportadoraId,
    );

    if (!transportadora) {
      throw new NotFoundException('Transportadora não encontrada');
    }

    return {
      email: input.email,
      transportadoraId: transportadora.id,
      transportadoraNome: transportadora.nome,
    };
  }
}
