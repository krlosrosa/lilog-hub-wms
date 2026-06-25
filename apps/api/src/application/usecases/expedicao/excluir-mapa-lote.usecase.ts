import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  MAPA_LOTE_REPOSITORY,
  type IMapaLoteRepository,
} from '../../../domain/repositories/expedicao/mapa-lote.repository.js';

export type ExcluirMapaLoteInput = {
  loteId: string;
  unidadeId: string;
};

export type ExcluirMapaLoteResponse = {
  loteId: string;
  transportesAfetados: number;
};

@Injectable()
export class ExcluirMapaLoteUseCase {
  constructor(
    @Inject(MAPA_LOTE_REPOSITORY)
    private readonly mapaLoteRepository: IMapaLoteRepository,
  ) {}

  async execute(input: ExcluirMapaLoteInput): Promise<ExcluirMapaLoteResponse> {
    const result = await this.mapaLoteRepository
      .excluir(input.loteId, input.unidadeId)
      .catch((error: unknown) => {
        if (error instanceof Error) {
          throw new ConflictException(error.message);
        }

        throw error;
      });

    if (!result) {
      throw new NotFoundException('Lote de mapas não encontrado.');
    }

    return result;
  }
}
