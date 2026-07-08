import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';

import type { CriarDocumentoCobrancaResponseDto } from '../../dtos/cobranca-transportadora/listar-documentos-cobranca.dto.js';
import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type CriarDocumentoCobrancaInput,
  type ICobrancaTransportadoraRepository,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';

type CriarDocumentoCobrancaUseCaseInput = {
  unidadeId: string;
  transportadoraId?: string | null;
  transportadoraNome: string;
  processoDebitoIds: string[];
  observacao?: string;
  emitidoPorUserId?: number;
};

@Injectable()
export class CriarDocumentoCobrancaUseCase {
  constructor(
    @Inject(COBRANCA_TRANSPORTADORA_REPOSITORY)
    private readonly cobrancaRepository: ICobrancaTransportadoraRepository,
  ) {}

  async execute(
    input: CriarDocumentoCobrancaUseCaseInput,
  ): Promise<CriarDocumentoCobrancaResponseDto> {
    if (input.processoDebitoIds.length === 0) {
      throw new BadRequestException(
        'Informe ao menos um processo de débito para o documento.',
      );
    }

    const payload: CriarDocumentoCobrancaInput = {
      unidadeId: input.unidadeId,
      transportadoraId: input.transportadoraId ?? null,
      transportadoraNome: input.transportadoraNome,
      processoDebitoIds: input.processoDebitoIds,
      observacao: input.observacao,
      emitidoPorUserId: input.emitidoPorUserId ?? null,
    };

    try {
      const result = await this.cobrancaRepository.criarDocumentoCobranca(payload);

      return {
        id: result.id,
        numeroDocumento: result.numeroDocumento,
        status: result.status,
        valorTotal: result.valorTotal,
        quantidadeProcessos: result.quantidadeProcessos,
        quantidadeItens: result.quantidadeItens,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao criar documento.';
      throw new BadRequestException(message);
    }
  }
}
