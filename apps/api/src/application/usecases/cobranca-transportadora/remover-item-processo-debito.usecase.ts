import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { RemoverItemProcessoDebitoResponseDto } from '../../dtos/cobranca-transportadora/listar-processos-debito.dto.js';
import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type ICobrancaTransportadoraRepository,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';

type RemoverItemProcessoDebitoInput = {
  processoId: string;
  itemId: string;
  unidadeId: string;
  criadoPorUserId?: number | null;
};

@Injectable()
export class RemoverItemProcessoDebitoUseCase {
  constructor(
    @Inject(COBRANCA_TRANSPORTADORA_REPOSITORY)
    private readonly cobrancaRepository: ICobrancaTransportadoraRepository,
  ) {}

  async execute(
    input: RemoverItemProcessoDebitoInput,
  ): Promise<RemoverItemProcessoDebitoResponseDto> {
    const result = await this.cobrancaRepository.removerItemProcesso({
      processoId: input.processoId,
      itemId: input.itemId,
      unidadeId: input.unidadeId,
      criadoPorUserId: input.criadoPorUserId,
    });

    if (!result) {
      throw new NotFoundException('Item do processo de débito não encontrado.');
    }

    return {
      id: result.id,
      processoDebitoId: result.processoDebitoId,
      valorTotalProcesso: result.valorTotalProcesso,
      quantidadeItens: result.quantidadeItens,
    };
  }
}
