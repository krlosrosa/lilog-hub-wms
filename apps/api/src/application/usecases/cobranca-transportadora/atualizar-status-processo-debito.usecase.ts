import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { AtualizarStatusProcessoDebitoResponseDto } from '../../dtos/cobranca-transportadora/listar-processos-debito.dto.js';
import { PortalNotificacaoService } from '../../services/portal-notificacao.service.js';
import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type AtualizarStatusProcessoInput,
  type ICobrancaTransportadoraRepository,
  type ProcessoDebitoStatus,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';

type AtualizarStatusProcessoDebitoInput = {
  processoId: string;
  unidadeId: string;
  status: ProcessoDebitoStatus;
  observacao?: string;
  criadoPorUserId?: number;
};

@Injectable()
export class AtualizarStatusProcessoDebitoUseCase {
  constructor(
    @Inject(COBRANCA_TRANSPORTADORA_REPOSITORY)
    private readonly cobrancaRepository: ICobrancaTransportadoraRepository,
    private readonly portalNotificacaoService: PortalNotificacaoService,
  ) {}

  async execute(
    input: AtualizarStatusProcessoDebitoInput,
  ): Promise<AtualizarStatusProcessoDebitoResponseDto> {
    const processo = await this.cobrancaRepository.buscarProcessoDetalhe(
      input.processoId,
      input.unidadeId,
    );

    if (!processo) {
      throw new NotFoundException('Processo de débito não encontrado.');
    }

    if (processo.status === 'incluido_em_documento') {
      throw new BadRequestException(
        'Não é possível alterar status de processo já incluído em documento.',
      );
    }

    const payload: AtualizarStatusProcessoInput = {
      processoId: input.processoId,
      unidadeId: input.unidadeId,
      status: input.status,
      observacao: input.observacao,
      criadoPorUserId: input.criadoPorUserId ?? null,
    };

    const result = await this.cobrancaRepository.atualizarStatusProcesso(payload);

    if (!result) {
      throw new NotFoundException('Processo de débito não encontrado.');
    }

    await this.portalNotificacaoService.notificarStatusAtualizado({
      processoDebitoId: result.id,
      transportadoraId: processo.transportadoraId,
      codigoDemanda: processo.codigoDemanda,
      statusNovo: result.status,
    });

    return {
      id: result.id,
      status: result.status,
      statusAnterior: result.statusAnterior,
      updatedAt: result.updatedAt.toISOString(),
    };
  }
}
