import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  VincularNfsDevolucaoBodyInput,
  VincularNfsDevolucaoResponse,
} from '../../dtos/expedicao/nfs-devolucao-transporte.dto.js';
import { findDevolucaoNfsElegiveisByIdsDb } from '../../../infra/db/devolucao/find-devolucao-nfs-by-ids.drizzle.js';
import { listTransportesByIdsDb } from '../../../infra/db/expedicao/list-transportes-by-ids.drizzle.js';
import { vincularNfsDevolucaoTransporteDb } from '../../../infra/db/expedicao/vincular-nfs-devolucao-transporte.drizzle.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../../../infra/db/providers/drizzle/drizzle.provider.js';

@Injectable()
export class VincularNfsDevolucaoTransporteUseCase {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient) {}

  async execute(
    input: VincularNfsDevolucaoBodyInput,
  ): Promise<VincularNfsDevolucaoResponse> {
    const transportes = await listTransportesByIdsDb(
      this.db,
      input.unidadeId,
      [input.transporteId],
    );

    const transporte = transportes[0];

    if (!transporte) {
      throw new NotFoundException('Transporte não encontrado para a unidade informada.');
    }

    const notasFiscais = await findDevolucaoNfsElegiveisByIdsDb(this.db, {
      unidadeId: input.unidadeId,
      nfIds: input.nfIds,
    });

    if (notasFiscais.length !== input.nfIds.length) {
      const encontrados = new Set(notasFiscais.map((nota) => nota.id));
      const invalidos = input.nfIds.filter((id) => !encontrados.has(id));

      throw new BadRequestException({
        message:
          'Uma ou mais notas fiscais não estão elegíveis (reentrega/devolução total) ou já foram vinculadas.',
        nfIdsInvalidos: invalidos,
      });
    }

    const semItens = notasFiscais.filter((nota) => nota.itens.length === 0);

    if (semItens.length > 0) {
      throw new BadRequestException({
        message: 'Uma ou mais notas fiscais não possuem itens para vincular.',
        numerosNf: semItens.map((nota) => nota.numeroNf),
      });
    }

    return vincularNfsDevolucaoTransporteDb(this.db, {
      unidadeId: input.unidadeId,
      transporteId: input.transporteId,
      uploadLoteId: transporte.uploadLoteId,
      transporteCidade: transporte.cidade,
      notasFiscais,
    });
  }
}
