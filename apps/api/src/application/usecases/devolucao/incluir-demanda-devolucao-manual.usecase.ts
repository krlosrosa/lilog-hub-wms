import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { formatIdentificadorViagemRavex } from '../../services/expedicao/format-identificador-viagem-ravex.js';
import { buildCodigoDemandaViagemRavex } from '../../services/devolucao/map-anomalias-ravex-devolucao.js';
import { GerarDemandaDevolucaoViagemUseCase } from './gerar-demanda-devolucao-viagem.usecase.js';
import {
  DEVOLUCAO_REPOSITORY,
  type IDevolucaoRepository,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import {
  TRANSPORTE_REPOSITORY,
  type ITransporteRepository,
} from '../../../domain/repositories/expedicao/transporte.repository.js';
import { RavexViagemClient } from '../../../infra/clients/ravex/ravex-viagem.client.js';

export type IncluirDemandaDevolucaoManualInput = {
  unidadeId: string;
  viagemId?: number;
  numeroTransporte?: string;
};

export type IncluirDemandaManualResult = {
  created: boolean;
  demanda: {
    id: string;
    codigoDemanda: string;
    status: string;
  } | null;
};

@Injectable()
export class IncluirDemandaDevolucaoManualUseCase {
  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
    @Inject(TRANSPORTE_REPOSITORY)
    private readonly transporteRepository: ITransporteRepository,
    @Inject(RavexViagemClient)
    private readonly ravexViagemClient: RavexViagemClient,
    @Inject(GerarDemandaDevolucaoViagemUseCase)
    private readonly gerarDemandaDevolucaoViagemUseCase: GerarDemandaDevolucaoViagemUseCase,
  ) {}

  async execute(
    input: IncluirDemandaDevolucaoManualInput,
  ): Promise<IncluirDemandaManualResult> {
    if (!input.viagemId && !input.numeroTransporte) {
      throw new BadRequestException(
        'Informe o ID da viagem RAVEX ou o número do transporte.',
      );
    }

    const { viagemId, transporteId } = await this.resolveViagemContext(input);

    const codigoDemanda = buildCodigoDemandaViagemRavex(viagemId);
    const existingBefore =
      await this.devolucaoRepository.findDemandaByCodigo(
        input.unidadeId,
        codigoDemanda,
      );

    await this.gerarDemandaDevolucaoViagemUseCase.execute({
      transporteId,
      unidadeId: input.unidadeId,
      viagemId,
    });

    const demanda = await this.devolucaoRepository.findDemandaByCodigo(
      input.unidadeId,
      codigoDemanda,
    );

    if (!demanda) {
      return { created: false, demanda: null };
    }

    return {
      created: !existingBefore,
      demanda: {
        id: demanda.id,
        codigoDemanda: demanda.codigoDemanda,
        status: demanda.status,
      },
    };
  }

  private async resolveViagemContext(
    input: IncluirDemandaDevolucaoManualInput,
  ): Promise<{ viagemId: number; transporteId: string | null }> {
    if (input.numeroTransporte) {
      return this.resolveFromNumeroTransporte(
        input.numeroTransporte,
        input.unidadeId,
      );
    }

    return this.resolveFromViagemId(input.viagemId!, input.unidadeId);
  }

  private async resolveFromNumeroTransporte(
    numeroTransporte: string,
    unidadeId: string,
  ): Promise<{ viagemId: number; transporteId: string | null }> {
    const context = await this.transporteRepository.findViagemRavexContext(
      numeroTransporte,
      unidadeId,
    );

    if (!context) {
      throw new NotFoundException(
        `Transporte "${numeroTransporte}" não encontrado nesta unidade.`,
      );
    }

    if (context.viagemId) {
      return {
        viagemId: context.viagemId,
        transporteId: context.id,
      };
    }

    const identificador = formatIdentificadorViagemRavex(context.rota);

    try {
      const viagem =
        await this.ravexViagemClient.getViagemPorIdentificador(identificador);

      return {
        viagemId: viagem.id,
        transporteId: context.id,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          `Viagem RAVEX não encontrada para o transporte "${numeroTransporte}".`,
        );
      }

      throw error;
    }
  }

  private async resolveFromViagemId(
    viagemId: number,
    unidadeId: string,
  ): Promise<{ viagemId: number; transporteId: string | null }> {
    await this.ravexViagemClient.getViagemPorId(viagemId);

    const transporteId =
      await this.transporteRepository.findTransporteIdByViagemId(
        viagemId,
        unidadeId,
      );

    return { viagemId, transporteId };
  }
}
