import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { AtualizarItemProcessoDebitoResponseDto } from '../../dtos/cobranca-transportadora/listar-processos-debito.dto.js';
import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type AtualizarItemProcessoInput,
  type DebitoItemStatus,
  type ICobrancaTransportadoraRepository,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';

type AtualizarItemProcessoDebitoInput = {
  processoId: string;
  itemId: string;
  unidadeId: string;
  valorUnitario?: number | null;
  valorDebito?: number;
  quantidade?: number;
  status?: DebitoItemStatus;
  observacao?: string | null;
  criadoPorUserId?: number | null;
};

@Injectable()
export class AtualizarItemProcessoDebitoUseCase {
  constructor(
    @Inject(COBRANCA_TRANSPORTADORA_REPOSITORY)
    private readonly cobrancaRepository: ICobrancaTransportadoraRepository,
  ) {}

  async execute(
    input: AtualizarItemProcessoDebitoInput,
  ): Promise<AtualizarItemProcessoDebitoResponseDto> {
    const payload: AtualizarItemProcessoInput = {
      processoId: input.processoId,
      itemId: input.itemId,
      unidadeId: input.unidadeId,
      valorUnitario: input.valorUnitario,
      valorDebito: input.valorDebito,
      quantidade: input.quantidade,
      status: input.status,
      observacao: input.observacao,
      criadoPorUserId: input.criadoPorUserId,
    };

    const result = await this.cobrancaRepository.atualizarItemProcesso(payload);

    if (!result) {
      throw new NotFoundException('Item do processo de débito não encontrado.');
    }

    return {
      id: result.id,
      processoDebitoId: result.processoDebitoId,
      valorDebito: result.valorDebito,
      status: result.status,
      valorTotalProcesso: result.valorTotalProcesso,
    };
  }
}
