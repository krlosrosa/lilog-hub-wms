import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { AtualizarItensProcessoDebitoEmMassaResponseDto } from '../../dtos/cobranca-transportadora/listar-processos-debito.dto.js';
import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type AtualizarItemProcessoEmMassaItemInput,
  type AtualizarItensProcessoEmMassaInput,
  type DebitoItemStatus,
  type ICobrancaTransportadoraRepository,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';

type AtualizarItensProcessoDebitoEmMassaUseCaseInput = {
  processoId: string;
  unidadeId: string;
  itens: AtualizarItemProcessoEmMassaItemInput[];
  criadoPorUserId?: number | null;
};

@Injectable()
export class AtualizarItensProcessoDebitoEmMassaUseCase {
  constructor(
    @Inject(COBRANCA_TRANSPORTADORA_REPOSITORY)
    private readonly cobrancaRepository: ICobrancaTransportadoraRepository,
  ) {}

  async execute(
    input: AtualizarItensProcessoDebitoEmMassaUseCaseInput,
  ): Promise<AtualizarItensProcessoDebitoEmMassaResponseDto> {
    const payload: AtualizarItensProcessoEmMassaInput = {
      processoId: input.processoId,
      unidadeId: input.unidadeId,
      itens: input.itens.map((item) => ({
        itemId: item.itemId,
        valorUnitario: item.valorUnitario,
        valorDebito: item.valorDebito,
        quantidade: item.quantidade,
        status: item.status as DebitoItemStatus | undefined,
        observacao: item.observacao,
      })),
      criadoPorUserId: input.criadoPorUserId,
    };

    const result =
      await this.cobrancaRepository.atualizarItensProcessoEmMassa(payload);

    if (!result) {
      throw new NotFoundException(
        'Processo de débito ou itens não encontrados.',
      );
    }

    return {
      quantidadeItensAtualizados: result.quantidadeItensAtualizados,
      valorTotalProcesso: result.valorTotalProcesso,
    };
  }
}
