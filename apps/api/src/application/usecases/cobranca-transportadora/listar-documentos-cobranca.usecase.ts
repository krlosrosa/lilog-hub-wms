import { Inject, Injectable } from '@nestjs/common';

import type { ListarDocumentosCobrancaResponseDto } from '../../dtos/cobranca-transportadora/listar-documentos-cobranca.dto.js';
import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type ICobrancaTransportadoraRepository,
  type ListarDocumentosFilter,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';

@Injectable()
export class ListarDocumentosCobrancaUseCase {
  constructor(
    @Inject(COBRANCA_TRANSPORTADORA_REPOSITORY)
    private readonly cobrancaRepository: ICobrancaTransportadoraRepository,
  ) {}

  async execute(
    filter: ListarDocumentosFilter,
  ): Promise<ListarDocumentosCobrancaResponseDto> {
    const documentos = await this.cobrancaRepository.listarDocumentos(filter);

    return {
      documentos: documentos.map((doc) => ({
        id: doc.id,
        unidadeId: doc.unidadeId,
        numeroDocumento: doc.numeroDocumento,
        transportadoraId: doc.transportadoraId,
        transportadoraNome: doc.transportadoraNome,
        status: doc.status,
        valorTotal: doc.valorTotal,
        quantidadeProcessos: doc.quantidadeProcessos,
        quantidadeItens: doc.quantidadeItens,
        emitidoEm: doc.emitidoEm?.toISOString() ?? null,
        enviadoEm: doc.enviadoEm?.toISOString() ?? null,
        pagoEm: doc.pagoEm?.toISOString() ?? null,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      })),
    };
  }
}
