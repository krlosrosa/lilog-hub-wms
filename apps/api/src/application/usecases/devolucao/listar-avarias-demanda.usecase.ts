import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { ListarAvariasDetalheResponseDto } from '../../dtos/devolucao/buscar-demanda-devolucao.dto.js';
import { resolveAvariaPhotoUrls } from '../../services/devolucao/resolve-avaria-photo-urls.js';
import {
  DEVOLUCAO_REPOSITORY,
  type IDevolucaoRepository,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import {
  DOCUMENTO_REPOSITORY,
  type IDocumentoRepository,
} from '../../../domain/repositories/documento/documento.repository.js';
import {
  R2_PROVIDER,
  type R2Config,
} from '../../../infra/clients/r2/r2.provider.js';

export type ListarAvariasDemandaInput = {
  demandaId: string;
  unidadeId: string;
};

@Injectable()
export class ListarAvariasDemandaUseCase {
  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
    @Inject(DOCUMENTO_REPOSITORY)
    private readonly documentoRepository: IDocumentoRepository,
    @Inject(R2_PROVIDER)
    private readonly r2Config: R2Config | null,
  ) {}

  async execute(
    input: ListarAvariasDemandaInput,
  ): Promise<ListarAvariasDetalheResponseDto> {
    const demanda = await this.devolucaoRepository.buscarDemanda({
      demandaId: input.demandaId,
      unidadeId: input.unidadeId,
    });

    if (!demanda) {
      throw new NotFoundException('Demanda de devolução não encontrada.');
    }

    const avarias = await this.devolucaoRepository.listarAvariasDetalhe(
      input.demandaId,
      input.unidadeId,
    );

    return {
      avarias: await Promise.all(
        avarias.map(async (avaria) => ({
          id: avaria.id,
          demandaId: avaria.demandaId,
          itemId: avaria.itemId,
          itemSku: avaria.itemSku,
          tipo: avaria.tipo,
          natureza: avaria.natureza,
          causa: avaria.causa,
          quantidadeCaixa: avaria.quantidadeCaixa,
          quantidadeUnidade: avaria.quantidadeUnidade,
          skusAfetados: avaria.skusAfetados,
          observacao: avaria.observacao,
          photoUrls: await resolveAvariaPhotoUrls(
            this.documentoRepository,
            this.r2Config,
            avaria.photoUrls,
          ),
          createdAt: avaria.createdAt.toISOString(),
        })),
      ),
    };
  }
}
