import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { AtualizarStatusGrupoDescargaResponseDto } from '../../dtos/devolucao/grupo-descarga-devolucao.dto.js';
import { DevolucaoCobrancaEventPublisher } from '../../services/devolucao/devolucao-cobranca-event.publisher.js';
import { DevolucaoNotificacaoEventPublisher } from '../../services/devolucao/devolucao-notificacao-event.publisher.js';
import {
  DEVOLUCAO_REPOSITORY,
  type AtualizarStatusGrupoDescargaInput,
  type IDevolucaoRepository,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';

@Injectable()
export class AtualizarStatusGrupoDescargaDevolucaoUseCase {
  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
    private readonly devolucaoCobrancaEventPublisher: DevolucaoCobrancaEventPublisher,
    private readonly devolucaoNotificacaoEventPublisher: DevolucaoNotificacaoEventPublisher,
  ) {}

  async execute(
    input: AtualizarStatusGrupoDescargaInput,
  ): Promise<AtualizarStatusGrupoDescargaResponseDto> {
    const detalheAntes = await this.devolucaoRepository.buscarGrupoDescarga({
      grupoId: input.grupoId,
      unidadeId: input.unidadeId,
    });

    if (!detalheAntes) {
      throw new NotFoundException('Grupo de descarga não encontrado.');
    }

    const result =
      await this.devolucaoRepository.atualizarStatusGrupoDescarga(input);

    if (!result) {
      throw new NotFoundException('Grupo de descarga não encontrado.');
    }

    if (input.status === 'concluida') {
      for (const demanda of detalheAntes.demandas) {
        await this.devolucaoCobrancaEventPublisher.publishGerarProcessoDebito({
          demandaId: demanda.id,
          unidadeId: input.unidadeId,
        });
        await this.devolucaoNotificacaoEventPublisher.publishNotificarAnomalia({
          demandaId: demanda.id,
          unidadeId: input.unidadeId,
        });
      }
    }

    return {
      id: result.id,
      codigoGrupo: result.codigoGrupo,
      status: result.status,
      statusAnterior: result.statusAnterior,
      updatedAt: result.updatedAt.toISOString(),
    };
  }
}
