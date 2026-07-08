import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { RegistrarInteracaoPortalResponseDto } from '../../dtos/portal/portal-cobranca.dto.js';
import type { z } from 'zod';
import type { InteracaoTipoPortalSchema } from '../../dtos/portal/portal-cobranca.dto.js';
import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type ICobrancaTransportadoraRepository,
  type ProcessoDebitoStatus,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';

type InteracaoTipoPortal = z.infer<typeof InteracaoTipoPortalSchema>;

type RegistrarInteracaoPortalInput = {
  processoId: string;
  transportadoraId: string;
  tipo: InteracaoTipoPortal;
  descricao: string;
  anexoChaves: string[];
};

const STATUS_BLOQUEADOS: ProcessoDebitoStatus[] = [
  'aprovado',
  'incluido_em_documento',
  'cancelado',
];

@Injectable()
export class RegistrarInteracaoPortalUseCase {
  constructor(
    @Inject(COBRANCA_TRANSPORTADORA_REPOSITORY)
    private readonly cobrancaRepository: ICobrancaTransportadoraRepository,
  ) {}

  async execute(
    input: RegistrarInteracaoPortalInput,
  ): Promise<RegistrarInteracaoPortalResponseDto> {
    const resumo = await this.cobrancaRepository.buscarProcessoResumoPortal(
      input.processoId,
      input.transportadoraId,
    );

    if (!resumo) {
      throw new NotFoundException('Processo de débito não encontrado.');
    }

    if (resumo.transportadoraId !== input.transportadoraId) {
      throw new ForbiddenException(
        'Este processo não pertence à sua transportadora.',
      );
    }

    if (STATUS_BLOQUEADOS.includes(resumo.status)) {
      throw new BadRequestException(
        'Não é possível enviar interação para um processo encerrado.',
      );
    }

    let interacao;

    try {
      interacao = await this.cobrancaRepository.criarInteracao({
        processoDebitoId: input.processoId,
        autor: 'transportadora',
        tipo: input.tipo,
        descricao: input.descricao.trim(),
        anexoChaves: input.anexoChaves,
        transportadoraId: input.transportadoraId,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'PROCESSO_NAO_ENCONTRADO') {
        throw new NotFoundException('Processo de débito não encontrado.');
      }

      throw error;
    }

    const statusAtualizado =
      resumo.status === 'aberto' ? 'em_analise' : resumo.status;

    return {
      id: interacao.id,
      processoDebitoId: interacao.processoDebitoId,
      autor: interacao.autor,
      tipo: interacao.tipo as InteracaoTipoPortal,
      descricao: interacao.descricao,
      anexoChaves: interacao.anexoChaves,
      createdAt: interacao.createdAt.toISOString(),
      statusProcesso: statusAtualizado,
    };
  }
}
