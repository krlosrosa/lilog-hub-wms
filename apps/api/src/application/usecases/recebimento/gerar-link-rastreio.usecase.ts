import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  isRastreioFinalizado,
  resolvePwaBaseUrl,
  resolveRastreioSituacaoLabel,
} from '../../../domain/services/resolve-rastreio-status.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';

export type GerarLinkRastreioInput = {
  preRecebimentoId: string;
  regenerar?: boolean;
};

@Injectable()
export class GerarLinkRastreioUseCase {
  constructor(
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: GerarLinkRastreioInput) {
    const result = await this.preRecebimentoRepository.gerarLinkRastreio(
      input.preRecebimentoId,
      { regenerar: input.regenerar },
    );

    if (!result) {
      throw new NotFoundException(
        `Pré-recebimento "${input.preRecebimentoId}" não encontrado`,
      );
    }

    const baseUrl = resolvePwaBaseUrl(this.configService);

    return {
      token: result.token,
      url: `${baseUrl}/rastreio/${result.token}`,
    };
  }
}

@Injectable()
export class GetRastreioStatusUseCase {
  constructor(
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
  ) {}

  async execute(token: string) {
    const status = await this.preRecebimentoRepository.findRastreioByToken(token);

    if (!status) {
      throw new NotFoundException('Link de rastreio inválido ou expirado');
    }

    return {
      placa: status.placa,
      transportadoraNome: status.transportadoraNome,
      situacao: status.situacao,
      situacaoLabel: resolveRastreioSituacaoLabel(
        status.situacao,
        status.docaNome,
      ),
      docaNome: status.docaNome,
      horarioPrevisto: status.horarioPrevisto.toISOString(),
      dataChegada: status.dataChegada?.toISOString() ?? null,
      unidadeNome: status.unidadeNome,
      finalizado: isRastreioFinalizado(status.situacao),
    };
  }
}
