import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { RegistrarFaltaPesoResponseDto } from '../../dtos/devolucao/falta-peso-devolucao.dto.js';
import {
  DEVOLUCAO_REPOSITORY,
  type IDevolucaoRepository,
  type RegistrarFaltaPesoInput,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import {
  FaltaPesoDevolucaoConflictError,
  FaltaPesoDevolucaoValidationError,
} from '../../../infra/db/devolucao/registrar-falta-peso.drizzle.js';

@Injectable()
export class RegistrarFaltaPesoDevolucaoUseCase {
  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
  ) {}

  async execute(
    input: RegistrarFaltaPesoInput,
  ): Promise<RegistrarFaltaPesoResponseDto> {
    if (input.diferencaKg <= 0) {
      throw new BadRequestException(
        'A diferença de peso deve ser maior que zero.',
      );
    }

    const demanda = await this.devolucaoRepository.buscarDemanda({
      demandaId: input.demandaId,
      unidadeId: input.unidadeId,
    });

    if (!demanda) {
      throw new NotFoundException('Demanda de devolução não encontrada.');
    }

    const notaFiscal = demanda.notasFiscais.find(
      (nf) => nf.id === input.notaFiscalId,
    );

    if (!notaFiscal) {
      throw new BadRequestException(
        'Nota fiscal não pertence à demanda informada.',
      );
    }

    const item = notaFiscal.itens.find((entry) => entry.id === input.itemId);

    if (!item) {
      throw new BadRequestException(
        'Item não pertence à nota fiscal informada.',
      );
    }

    if (!item.pesoVariavel) {
      throw new BadRequestException(
        'Somente produtos de peso variável podem registrar falta de peso.',
      );
    }

    if (item.sku !== input.sku) {
      throw new BadRequestException(
        'SKU informado não corresponde ao item selecionado.',
      );
    }

    try {
      const result = await this.devolucaoRepository.registrarFaltaPeso(input);

      if (!result) {
        throw new NotFoundException('Demanda de devolução não encontrada.');
      }

      return result;
    } catch (error) {
      if (error instanceof FaltaPesoDevolucaoConflictError) {
        throw new ConflictException(error.message);
      }

      if (error instanceof FaltaPesoDevolucaoValidationError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
