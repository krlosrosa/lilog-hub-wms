import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { excluirMapaConferenciaReentregaTransporteDb } from '../../../infra/db/expedicao/mapa-conferencia-reentrega.drizzle.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../../../infra/db/providers/drizzle/drizzle.provider.js';

export type ExcluirMapaConferenciaReentregaTransporteInput = {
  transporteId: string;
  unidadeId: string;
};

export type ExcluirMapaConferenciaReentregaTransporteResponse = {
  transporteId: string;
  loteIdsExcluidos: string[];
};

@Injectable()
export class ExcluirMapaConferenciaReentregaTransporteUseCase {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient) {}

  async execute(
    input: ExcluirMapaConferenciaReentregaTransporteInput,
  ): Promise<ExcluirMapaConferenciaReentregaTransporteResponse> {
    const result = await excluirMapaConferenciaReentregaTransporteDb(
      this.db,
      input,
    ).catch((error: unknown) => {
      if (error instanceof Error) {
        throw new ConflictException(error.message);
      }

      throw error;
    });

    if (!result) {
      throw new NotFoundException(
        'Mapa de conferência reentrega não encontrado para este transporte.',
      );
    }

    return result;
  }
}
