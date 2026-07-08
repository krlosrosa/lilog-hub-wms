import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  DesvincularNfsDevolucaoBodyInput,
  DesvincularNfsDevolucaoResponse,
} from '../../dtos/expedicao/nfs-devolucao-transporte.dto.js';
import { desvincularNfsDevolucaoTransporteDb } from '../../../infra/db/expedicao/desvincular-nfs-devolucao-transporte.drizzle.js';
import { listTransportesByIdsDb } from '../../../infra/db/expedicao/list-transportes-by-ids.drizzle.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../../../infra/db/providers/drizzle/drizzle.provider.js';

@Injectable()
export class DesvincularNfsDevolucaoTransporteUseCase {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient) {}

  async execute(
    input: DesvincularNfsDevolucaoBodyInput,
  ): Promise<DesvincularNfsDevolucaoResponse> {
    const transportes = await listTransportesByIdsDb(
      this.db,
      input.unidadeId,
      [input.transporteId],
    );

    if (!transportes[0]) {
      throw new NotFoundException('Transporte não encontrado para a unidade informada.');
    }

    try {
      return await desvincularNfsDevolucaoTransporteDb(this.db, {
        unidadeId: input.unidadeId,
        transporteId: input.transporteId,
        remessaIds: input.remessaIds,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (
          error.message.includes('mapa') ||
          error.message.includes('corte')
        ) {
          throw new ConflictException(error.message);
        }

        if (
          error.message.includes('Remessas inválidas') ||
          error.message.includes('não encontrado')
        ) {
          throw new BadRequestException({
            message: error.message,
          });
        }
      }

      throw error;
    }
  }
}
