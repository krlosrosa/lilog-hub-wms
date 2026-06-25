import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  DOCA_REPOSITORY,
  type IDocaRepository,
} from '../../../domain/repositories/doca/doca.repository.js';
import {
  TRANSPORTE_REPOSITORY,
  type AtualizarDadosCarregamentoTransporteResult,
  type ITransporteRepository,
} from '../../../domain/repositories/expedicao/transporte.repository.js';

export type AtualizarDadosCarregamentoTransporteInput = {
  transporteId: string;
  unidadeId: string;
  docaId?: string | null;
  lacreCarregamento?: string | null;
};

@Injectable()
export class AtualizarDadosCarregamentoTransporteUseCase {
  constructor(
    @Inject(TRANSPORTE_REPOSITORY)
    private readonly transporteRepository: ITransporteRepository,
    @Inject(DOCA_REPOSITORY)
    private readonly docaRepository: IDocaRepository,
  ) {}

  async execute(
    input: AtualizarDadosCarregamentoTransporteInput,
  ): Promise<AtualizarDadosCarregamentoTransporteResult> {
    const transporte = await this.transporteRepository.findStatusTransporte(
      input.transporteId,
      input.unidadeId,
    );

    if (!transporte) {
      throw new NotFoundException('Transporte não encontrado.');
    }

    if (input.docaId) {
      const doca = await this.docaRepository.findById(input.docaId);

      if (!doca) {
        throw new NotFoundException('Doca não encontrada.');
      }

      if (doca.unidadeId !== input.unidadeId) {
        throw new BadRequestException(
          'A doca informada não pertence à unidade do transporte.',
        );
      }

      if (doca.tipo !== 'expedicao' && doca.tipo !== 'compartilhada') {
        throw new BadRequestException(
          'A doca informada não é válida para expedição.',
        );
      }
    }

    const result = await this.transporteRepository.atualizarDadosCarregamento({
      transporteId: input.transporteId,
      unidadeId: input.unidadeId,
      docaId: input.docaId,
      lacreCarregamento: input.lacreCarregamento,
    });

    if (!result) {
      throw new NotFoundException('Transporte não encontrado.');
    }

    return result;
  }
}
