import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { AtualizarStatusDocumentoCobrancaResponseDto } from '../../dtos/cobranca-transportadora/listar-documentos-cobranca.dto.js';
import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type AtualizarStatusDocumentoInput,
  type DocumentoCobrancaStatus,
  type ICobrancaTransportadoraRepository,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';

type AtualizarStatusDocumentoCobrancaInput = {
  documentoId: string;
  unidadeId: string;
  status: DocumentoCobrancaStatus;
  observacao?: string;
  criadoPorUserId?: number;
};

@Injectable()
export class AtualizarStatusDocumentoCobrancaUseCase {
  constructor(
    @Inject(COBRANCA_TRANSPORTADORA_REPOSITORY)
    private readonly cobrancaRepository: ICobrancaTransportadoraRepository,
  ) {}

  async execute(
    input: AtualizarStatusDocumentoCobrancaInput,
  ): Promise<AtualizarStatusDocumentoCobrancaResponseDto> {
    const payload: AtualizarStatusDocumentoInput = {
      documentoId: input.documentoId,
      unidadeId: input.unidadeId,
      status: input.status,
      observacao: input.observacao,
      criadoPorUserId: input.criadoPorUserId ?? null,
    };

    const result =
      await this.cobrancaRepository.atualizarStatusDocumento(payload);

    if (!result) {
      throw new NotFoundException('Documento de cobrança não encontrado.');
    }

    return {
      id: result.id,
      status: result.status,
      statusAnterior: result.statusAnterior,
      updatedAt: result.updatedAt.toISOString(),
      emitidoEm: result.emitidoEm?.toISOString() ?? null,
      enviadoEm: result.enviadoEm?.toISOString() ?? null,
      pagoEm: result.pagoEm?.toISOString() ?? null,
    };
  }
}
