import { Inject, Injectable } from '@nestjs/common';

import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type ICobrancaTransportadoraRepository,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';

type MarcarNotificacoesLidasPortalInput = {
  ids: string[];
  transportadoraId: string;
};

@Injectable()
export class MarcarNotificacoesLidasPortalUseCase {
  constructor(
    @Inject(COBRANCA_TRANSPORTADORA_REPOSITORY)
    private readonly cobrancaRepository: ICobrancaTransportadoraRepository,
  ) {}

  async execute(input: MarcarNotificacoesLidasPortalInput): Promise<void> {
    await this.cobrancaRepository.marcarNotificacoesLidas(
      input.ids,
      input.transportadoraId,
    );
  }
}
