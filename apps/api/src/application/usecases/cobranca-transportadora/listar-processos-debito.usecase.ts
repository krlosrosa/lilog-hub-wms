import { Inject, Injectable } from '@nestjs/common';

import type { ListarProcessosDebitoResponseDto } from '../../dtos/cobranca-transportadora/listar-processos-debito.dto.js';
import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type ICobrancaTransportadoraRepository,
  type ListarProcessosFilter,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';

@Injectable()
export class ListarProcessosDebitoUseCase {
  constructor(
    @Inject(COBRANCA_TRANSPORTADORA_REPOSITORY)
    private readonly cobrancaRepository: ICobrancaTransportadoraRepository,
  ) {}

  async execute(
    filter: ListarProcessosFilter,
  ): Promise<ListarProcessosDebitoResponseDto> {
    const processos = await this.cobrancaRepository.listarProcessos(filter);

    return {
      processos: processos.map((p) => ({
        id: p.id,
        unidadeId: p.unidadeId,
        demandaId: p.demandaId,
        codigoDemanda: p.codigoDemanda,
        transporteId: p.transporteId,
        transportadoraId: p.transportadoraId,
        transportadoraNome: p.transportadoraNome,
        status: p.status,
        valorTotal: p.valorTotal,
        quantidadeItens: p.quantidadeItens,
        quantidadeItensFalta: p.quantidadeItensFalta,
        quantidadeItensAvaria: p.quantidadeItensAvaria,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    };
  }
}
