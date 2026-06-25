import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  TRANSPORTE_REPOSITORY,
  type ITransporteRepository,
} from '../../../domain/repositories/expedicao/transporte.repository.js';

export type ExcluirTransporteInput = {
  id: string;
  unidadeId: string;
};

export type ExcluirTransporteResponse = {
  id: string;
  rota: string;
};

@Injectable()
export class ExcluirTransporteUseCase {
  constructor(
    @Inject(TRANSPORTE_REPOSITORY)
    private readonly transporteRepository: ITransporteRepository,
  ) {}

  async execute(
    input: ExcluirTransporteInput,
  ): Promise<ExcluirTransporteResponse> {
    const result = await this.transporteRepository
      .excluir(input.id, input.unidadeId)
      .catch((error: unknown) => {
        if (error instanceof Error) {
          if (
            error.message.includes('mapa') ||
            error.message.includes('corte')
          ) {
            throw new ConflictException(error.message);
          }

          throw new BadRequestException(error.message);
        }

        throw error;
      });

    if (!result) {
      throw new NotFoundException('Transporte não encontrado.');
    }

    return result;
  }
}
