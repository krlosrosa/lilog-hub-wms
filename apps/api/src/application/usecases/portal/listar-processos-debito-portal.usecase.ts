import { Inject, Injectable } from '@nestjs/common';

import type { ListarProcessosDebitoPortalResponseDto } from '../../dtos/portal/portal-cobranca.dto.js';
import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type ICobrancaTransportadoraRepository,
  type ListarProcessosPortalFilter,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';

type ListarProcessosDebitoPortalInput = ListarProcessosPortalFilter;

@Injectable()
export class ListarProcessosDebitoPortalUseCase {
  constructor(
    @Inject(COBRANCA_TRANSPORTADORA_REPOSITORY)
    private readonly cobrancaRepository: ICobrancaTransportadoraRepository,
  ) {}

  async execute(
    input: ListarProcessosDebitoPortalInput,
  ): Promise<ListarProcessosDebitoPortalResponseDto> {
    const processos = await this.cobrancaRepository.listarProcessosPortal(input);

    return {
      processos: processos.map((processo) => ({
        id: processo.id,
        unidadeId: processo.unidadeId,
        demandaId: processo.demandaId,
        codigoDemanda: processo.codigoDemanda,
        transporteId: processo.transporteId,
        transportadoraId: processo.transportadoraId,
        transportadoraNome: processo.transportadoraNome,
        status: processo.status,
        valorTotal: processo.valorTotal,
        quantidadeItens: processo.quantidadeItens,
        quantidadeItensFalta: processo.quantidadeItensFalta,
        quantidadeItensAvaria: processo.quantidadeItensAvaria,
        createdAt: processo.createdAt.toISOString(),
        updatedAt: processo.updatedAt.toISOString(),
      })),
    };
  }
}
