import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  ListarNfsDevolucaoElegiveisQueryInput,
  ListarNfsDevolucaoElegiveisResponse,
} from '../../dtos/expedicao/nfs-devolucao-transporte.dto.js';
import { findNfsDevolucaoElegiveisDb } from '../../../infra/db/devolucao/find-nfs-devolucao-elegiveis.drizzle.js';
import { countRemessasReentregaTransporteDb } from '../../../infra/db/expedicao/vincular-nfs-devolucao-transporte.drizzle.js';
import { listTransportesByIdsDb } from '../../../infra/db/expedicao/list-transportes-by-ids.drizzle.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../../../infra/db/providers/drizzle/drizzle.provider.js';

export type ListarNfsDevolucaoElegiveisInput = ListarNfsDevolucaoElegiveisQueryInput & {
  transporteId: string;
};

@Injectable()
export class ListarNfsDevolucaoElegiveisUseCase {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient) {}

  async execute(
    input: ListarNfsDevolucaoElegiveisInput,
  ): Promise<ListarNfsDevolucaoElegiveisResponse> {
    const transportes = await listTransportesByIdsDb(
      this.db,
      input.unidadeId,
      [input.transporteId],
    );

    if (transportes.length === 0) {
      throw new NotFoundException('Transporte não encontrado para a unidade informada.');
    }

    const [notasFiscais, remessasReentregaVinculadas] = await Promise.all([
      findNfsDevolucaoElegiveisDb(this.db, input.unidadeId, {
        dataInicio: input.dataInicio,
        dataFim: input.dataFim,
      }),
      countRemessasReentregaTransporteDb(this.db, input.transporteId),
    ]);

    return {
      notasFiscais,
      remessasReentregaVinculadas,
    };
  }
}
