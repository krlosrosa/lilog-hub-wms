import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { RegistrarInteracaoCdResponseDto } from '../../dtos/cobranca-transportadora/listar-processos-debito.dto.js';
import { PortalNotificacaoService } from '../../services/portal-notificacao.service.js';
import type { z } from 'zod';
import type { InteracaoTipoCdSchema } from '../../dtos/cobranca-transportadora/listar-processos-debito.dto.js';
import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type ICobrancaTransportadoraRepository,
  type ProcessoDebitoStatus,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';

type InteracaoTipoCd = z.infer<typeof InteracaoTipoCdSchema>;

type RegistrarInteracaoCdInput = {
  processoId: string;
  unidadeId: string;
  tipo: InteracaoTipoCd;
  descricao: string;
  anexoChaves: string[];
  criadoPorUserId?: number | null;
};

const STATUS_BLOQUEADOS: ProcessoDebitoStatus[] = [
  'aprovado',
  'incluido_em_documento',
  'cancelado',
];

@Injectable()
export class RegistrarInteracaoCdUseCase {
  constructor(
    @Inject(COBRANCA_TRANSPORTADORA_REPOSITORY)
    private readonly cobrancaRepository: ICobrancaTransportadoraRepository,
    private readonly portalNotificacaoService: PortalNotificacaoService,
  ) {}

  async execute(
    input: RegistrarInteracaoCdInput,
  ): Promise<RegistrarInteracaoCdResponseDto> {
    const processo = await this.cobrancaRepository.buscarProcessoDetalhe(
      input.processoId,
      input.unidadeId,
    );

    if (!processo) {
      throw new NotFoundException('Processo de débito não encontrado.');
    }

    if (STATUS_BLOQUEADOS.includes(processo.status)) {
      throw new BadRequestException(
        'Não é possível enviar interação para um processo encerrado.',
      );
    }

    let interacao;

    try {
      interacao = await this.cobrancaRepository.criarInteracao({
        processoDebitoId: input.processoId,
        autor: 'cd',
        tipo: input.tipo,
        descricao: input.descricao.trim(),
        anexoChaves: input.anexoChaves,
        criadoPorUserId: input.criadoPorUserId ?? null,
        unidadeId: input.unidadeId,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'PROCESSO_NAO_ENCONTRADO') {
        throw new NotFoundException('Processo de débito não encontrado.');
      }

      throw error;
    }

    await this.portalNotificacaoService.notificarNovaInteracaoCd({
      processoDebitoId: input.processoId,
      transportadoraId: processo.transportadoraId,
      codigoDemanda: processo.codigoDemanda,
    });

    return {
      id: interacao.id,
      processoDebitoId: interacao.processoDebitoId,
      autor: interacao.autor,
      tipo: interacao.tipo as InteracaoTipoCd,
      descricao: interacao.descricao,
      anexoChaves: interacao.anexoChaves,
      criadoPorUserId: interacao.criadoPorUserId,
      createdAt: interacao.createdAt.toISOString(),
      statusProcesso: processo.status,
    };
  }
}
