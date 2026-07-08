import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { ValidarFaltaPesoResponseDto } from '../../dtos/devolucao/falta-peso-devolucao.dto.js';
import { mapFaltaPesoToResponse } from '../../services/devolucao/map-falta-peso-response.js';
import {
  DEVOLUCAO_REPOSITORY,
  type IDevolucaoRepository,
  type ValidarFaltaPesoInput,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';

const STATUS_PERMITIDOS_VALIDACAO = new Set([
  'em_analise',
  'em_execucao',
  'conferida',
  'concluida',
]);

@Injectable()
export class ValidarFaltaPesoDevolucaoUseCase {
  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
  ) {}

  async execute(
    input: ValidarFaltaPesoInput,
  ): Promise<ValidarFaltaPesoResponseDto> {
    const demanda = await this.devolucaoRepository.buscarDemanda({
      demandaId: input.demandaId,
      unidadeId: input.unidadeId,
    });

    if (!demanda) {
      throw new NotFoundException('Demanda de devolução não encontrada.');
    }

    if (!STATUS_PERMITIDOS_VALIDACAO.has(demanda.status)) {
      throw new BadRequestException(
        'A demanda deve estar em análise, execução ou concluída para validar falta de peso.',
      );
    }

    const faltasPeso = await this.devolucaoRepository.listarFaltasPeso({
      demandaId: input.demandaId,
      unidadeId: input.unidadeId,
    });

    const faltaAtual = faltasPeso.find((falta) => falta.id === input.faltaPesoId);

    if (!faltaAtual) {
      throw new NotFoundException('Falta de peso não encontrada.');
    }

    if (faltaAtual.status !== 'pendente') {
      throw new BadRequestException(
        'Somente faltas de peso pendentes podem ser validadas ou rejeitadas.',
      );
    }

    const result = await this.devolucaoRepository.validarFaltaPeso(input);

    if (!result) {
      throw new NotFoundException('Falta de peso não encontrada.');
    }

    return mapFaltaPesoToResponse(result);
  }
}
