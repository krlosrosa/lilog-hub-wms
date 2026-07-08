import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { RegistrarConferenciaItensResponseDto } from '../../dtos/devolucao/registrar-conferencia-devolucao.dto.js';
import { DevolucaoCobrancaEventPublisher } from '../../services/devolucao/devolucao-cobranca-event.publisher.js';
import { DevolucaoNotificacaoEventPublisher } from '../../services/devolucao/devolucao-notificacao-event.publisher.js';
import {
  DEVOLUCAO_REPOSITORY,
  type IDevolucaoRepository,
  type RegistrarConferenciaItensInput,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';

@Injectable()
export class RegistrarConferenciaItensUseCase {
  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
    private readonly devolucaoCobrancaEventPublisher: DevolucaoCobrancaEventPublisher,
    private readonly devolucaoNotificacaoEventPublisher: DevolucaoNotificacaoEventPublisher,
  ) {}

  async execute(
    input: RegistrarConferenciaItensInput,
  ): Promise<RegistrarConferenciaItensResponseDto> {
    const result = await this.devolucaoRepository.registrarConferenciaItens(input);

    if (!result) {
      throw new NotFoundException('Demanda de devolução não encontrada.');
    }

    if (result.status === 'concluida') {
      await this.devolucaoCobrancaEventPublisher.publishGerarProcessoDebito({
        demandaId: input.demandaId,
        unidadeId: input.unidadeId,
      });
      await this.devolucaoNotificacaoEventPublisher.publishNotificarAnomalia({
        demandaId: input.demandaId,
        unidadeId: input.unidadeId,
      });
    }

    return result;
  }
}
