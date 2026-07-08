import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import type { AtualizarStatusDemandaDevolucaoResponseDto } from '../../dtos/devolucao/listar-demandas-devolucao.dto.js';
import { DevolucaoCobrancaEventPublisher } from '../../services/devolucao/devolucao-cobranca-event.publisher.js';
import { DevolucaoNotificacaoEventPublisher } from '../../services/devolucao/devolucao-notificacao-event.publisher.js';
import {
  DEVOLUCAO_REPOSITORY,
  type AtualizarStatusDemandaInput,
  type IDevolucaoRepository,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';

type AtualizarStatusDemandaDevolucaoInput = {
  demandaId: string;
  unidadeId: string;
} & AtualizarStatusDemandaInput;

function isDemandaFaltaObservacao(observacao?: string | null): boolean {
  return observacao?.includes('Demanda de falta') ?? false;
}

@Injectable()
export class AtualizarStatusDemandaDevolucaoUseCase {
  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
    private readonly devolucaoCobrancaEventPublisher: DevolucaoCobrancaEventPublisher,
    private readonly devolucaoNotificacaoEventPublisher: DevolucaoNotificacaoEventPublisher,
  ) {}

  async execute(
    input: AtualizarStatusDemandaDevolucaoInput,
  ): Promise<AtualizarStatusDemandaDevolucaoResponseDto> {
    const demanda = await this.devolucaoRepository.buscarDemanda({
      demandaId: input.demandaId,
      unidadeId: input.unidadeId,
    });

    if (!demanda) {
      throw new NotFoundException('Demanda de devolução não encontrada.');
    }

    if (input.status === 'concluida' && demanda.status !== 'conferida') {
      if (!isDemandaFaltaObservacao(input.observacao)) {
        throw new BadRequestException(
          'Só é possível finalizar demandas com status Conferido.',
        );
      }

      if (demanda.status !== 'aberta') {
        throw new BadRequestException(
          'Demanda de falta só pode ser registrada com status Aberta.',
        );
      }
    }

    if (
      input.status === 'em_execucao' &&
      input.observacao?.includes('reaberta') &&
      demanda.status !== 'conferida'
    ) {
      throw new BadRequestException(
        'Só é possível reabrir demandas com status Conferido.',
      );
    }

    if (
      input.status === 'em_analise' &&
      input.observacao?.includes('Liberado para armazém') &&
      demanda.status !== 'aberta'
    ) {
      throw new BadRequestException(
        'Só é possível liberar para armazém demandas com status Aberta.',
      );
    }

    const result = await this.devolucaoRepository.atualizarStatus(
      input.demandaId,
      input.unidadeId,
      {
        status: input.status,
        observacao: input.observacao,
        doca: input.doca,
        cargaSegregada: input.cargaSegregada,
        paletesEsperados: input.paletesEsperados,
        criadoPorUserId: input.criadoPorUserId,
      },
    );

    if (!result) {
      throw new NotFoundException('Demanda de devolução não encontrada.');
    }

    if (
      result.status === 'concluida' &&
      result.statusAnterior !== 'concluida'
    ) {
      await this.devolucaoCobrancaEventPublisher.publishGerarProcessoDebito({
        demandaId: input.demandaId,
        unidadeId: input.unidadeId,
      });
      await this.devolucaoNotificacaoEventPublisher.publishNotificarAnomalia({
        demandaId: input.demandaId,
        unidadeId: input.unidadeId,
      });
    }

    return {
      id: result.id,
      codigoDemanda: result.codigoDemanda,
      status: result.status,
      statusAnterior: result.statusAnterior,
      updatedAt: result.updatedAt.toISOString(),
      concluidaAt: result.concluidaAt?.toISOString() ?? null,
    };
  }
}
