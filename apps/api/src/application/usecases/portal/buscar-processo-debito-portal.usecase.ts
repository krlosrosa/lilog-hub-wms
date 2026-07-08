import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { BuscarProcessoDebitoPortalResponseDto } from '../../dtos/portal/portal-cobranca.dto.js';
import { BuscarProcessoDebitoUseCase } from '../cobranca-transportadora/buscar-processo-debito.usecase.js';
import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type ICobrancaTransportadoraRepository,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';

type BuscarProcessoDebitoPortalInput = {
  processoId: string;
  transportadoraId: string;
};

@Injectable()
export class BuscarProcessoDebitoPortalUseCase {
  constructor(
    @Inject(COBRANCA_TRANSPORTADORA_REPOSITORY)
    private readonly cobrancaRepository: ICobrancaTransportadoraRepository,
    private readonly buscarProcessoDebitoUseCase: BuscarProcessoDebitoUseCase,
  ) {}

  async execute(
    input: BuscarProcessoDebitoPortalInput,
  ): Promise<BuscarProcessoDebitoPortalResponseDto> {
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

    return this.buscarProcessoDebitoUseCase.execute({
      processoId: input.processoId,
      unidadeId: resumo.unidadeId,
    });
  }
}
