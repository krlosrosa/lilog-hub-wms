import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import type { SalvarAlocacoesTransportesResponseDto } from '../../dtos/expedicao/salvar-alocacoes-transportes.dto.js';
import {
  TRANSPORTE_REPOSITORY,
  type ITransporteRepository,
  type SalvarAlocacaoTransporteInput,
} from '../../../domain/repositories/expedicao/transporte.repository.js';

type SalvarAlocacoesTransportesInput = {
  unidadeId: string;
  alocacoes: SalvarAlocacaoTransporteInput[];
};

@Injectable()
export class SalvarAlocacoesTransportesUseCase {
  constructor(
    @Inject(TRANSPORTE_REPOSITORY)
    private readonly transporteRepository: ITransporteRepository,
  ) {}

  async execute(
    input: SalvarAlocacoesTransportesInput,
  ): Promise<SalvarAlocacoesTransportesResponseDto> {
    if (!input.unidadeId?.trim()) {
      throw new BadRequestException('unidadeId é obrigatório');
    }

    if (!input.alocacoes.length) {
      throw new BadRequestException('Informe ao menos uma alocação');
    }

    const alocacoes = input.alocacoes.map((item) => ({
      transporteId: item.transporteId,
      placaTransportadoraId: item.placaTransportadoraId,
      placa: item.placa.trim(),
      transportadora: item.transportadora.trim(),
      motorista: item.motorista?.trim() || null,
      perfilTarifaId: item.perfilTarifaId ?? null,
      perfilTarifaNome: item.perfilTarifaNome?.trim() || null,
      perfilPagamentoId: item.perfilPagamentoId ?? null,
      perfilPagamentoNome: item.perfilPagamentoNome?.trim() || null,
      semCusto: item.semCusto ?? false,
      itinerario: item.itinerario?.trim() || null,
      nivelPrioridade: item.nivelPrioridade ?? null,
      horarioExpectativaSaida: item.horarioExpectativaSaida ?? null,
      cidade: item.cidade?.trim(),
      bairro: item.bairro?.trim() || null,
      isPrioridade: item.isPrioridade ?? false,
    }));

    for (const alocacao of alocacoes) {
      if (!alocacao.placa) {
        throw new BadRequestException('Placa é obrigatória em todas as alocações');
      }

      if (!alocacao.transportadora) {
        throw new BadRequestException(
          'Transportadora é obrigatória em todas as alocações',
        );
      }

      if (!alocacao.semCusto && !alocacao.perfilPagamentoId) {
        throw new BadRequestException(
          'Informe o perfil de pagamento ou marque como transporte sem custo.',
        );
      }
    }

    const resultado = await this.transporteRepository.salvarAlocacoes({
      unidadeId: input.unidadeId,
      alocacoes,
    });

    if (resultado.atualizados === 0) {
      throw new BadRequestException(
        'Nenhum transporte foi atualizado. Verifique os IDs informados.',
      );
    }

    return resultado;
  }
}
