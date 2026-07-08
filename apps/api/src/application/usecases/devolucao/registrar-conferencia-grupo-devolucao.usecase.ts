import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { RegistrarConferenciaGrupoResponseDto } from '../../dtos/devolucao/grupo-descarga-devolucao.dto.js';
import { DevolucaoCobrancaEventPublisher } from '../../services/devolucao/devolucao-cobranca-event.publisher.js';
import { DevolucaoNotificacaoEventPublisher } from '../../services/devolucao/devolucao-notificacao-event.publisher.js';
import {
  DEVOLUCAO_REPOSITORY,
  type IDevolucaoRepository,
  type RegistrarConferenciaGrupoInput,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';

@Injectable()
export class RegistrarConferenciaGrupoDevolucaoUseCase {
  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
    private readonly devolucaoCobrancaEventPublisher: DevolucaoCobrancaEventPublisher,
    private readonly devolucaoNotificacaoEventPublisher: DevolucaoNotificacaoEventPublisher,
  ) {}

  async execute(
    input: RegistrarConferenciaGrupoInput,
  ): Promise<RegistrarConferenciaGrupoResponseDto> {
    const result =
      await this.devolucaoRepository.registrarConferenciaGrupo(input);

    if (!result) {
      throw new NotFoundException('Grupo de descarga não encontrado.');
    }

    if (input.status === 'concluida') {
      for (const demandaId of result.demandasAtualizadas) {
        await this.devolucaoCobrancaEventPublisher.publishGerarProcessoDebito({
          demandaId,
          unidadeId: input.unidadeId,
        });
        await this.devolucaoNotificacaoEventPublisher.publishNotificarAnomalia({
          demandaId,
          unidadeId: input.unidadeId,
        });
      }
    }

    return result;
  }
}
