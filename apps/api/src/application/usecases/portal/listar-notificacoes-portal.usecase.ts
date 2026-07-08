import { Inject, Injectable } from '@nestjs/common';

import type { ListarNotificacoesPortalResponseDto } from '../../dtos/portal/portal-cobranca.dto.js';
import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type ICobrancaTransportadoraRepository,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';

type ListarNotificacoesPortalInput = {
  transportadoraId: string;
  apenasNaoLidas?: boolean;
  limit?: number;
};

@Injectable()
export class ListarNotificacoesPortalUseCase {
  constructor(
    @Inject(COBRANCA_TRANSPORTADORA_REPOSITORY)
    private readonly cobrancaRepository: ICobrancaTransportadoraRepository,
  ) {}

  async execute(
    input: ListarNotificacoesPortalInput,
  ): Promise<ListarNotificacoesPortalResponseDto> {
    const result = await this.cobrancaRepository.listarNotificacoesPortal(
      input.transportadoraId,
      input.apenasNaoLidas,
      input.limit,
    );

    return {
      notificacoes: result.notificacoes.map((notificacao) => ({
        id: notificacao.id,
        tipo: notificacao.tipo,
        titulo: notificacao.titulo,
        mensagem: notificacao.mensagem,
        rotaDestino: notificacao.rotaDestino,
        lida: notificacao.lida,
        createdAt: notificacao.createdAt.toISOString(),
      })),
      totalNaoLidas: result.totalNaoLidas,
    };
  }
}
