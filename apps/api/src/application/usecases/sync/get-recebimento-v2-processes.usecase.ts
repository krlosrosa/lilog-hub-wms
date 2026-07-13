import { Inject, Injectable } from '@nestjs/common';

import {
  CONFERENCIA_REPOSITORY,
  type IConferenciaRepository,
} from '../../../domain/repositories/recebimento/conferencia.repository.js';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';
import { resolveOperatorFuncionarioId } from '../../../domain/services/assert-operator-funcionario.js';
import {
  SYNC_REPOSITORY,
  type ISyncRepository,
} from '../../../domain/repositories/sync/sync.repository.js';

type GetRecebimentoV2ProcessesInput = {
  unidadeId: string;
  cursor?: string;
  limit: number;
  userId: number | null;
};

type ProcessHeader = {
  demandId: string;
  unidadeId: string;
  situacao: string;
  preRecebimentoSituacao: string;
  serverRevision: number;
  updatedAt: string;
  tombstone: boolean;
  supplier?: string;
  dock?: string | null;
  arrival?: string;
  placa?: string;
  conferente?: string;
  atribuidoAMim?: boolean;
};

type GetRecebimentoV2ProcessesResult = {
  items: ProcessHeader[];
  nextCursor: string | null;
  hasMore: boolean;
};

@Injectable()
export class GetRecebimentoV2ProcessesUseCase {
  constructor(
    @Inject(CONFERENCIA_REPOSITORY)
    private readonly conferenciaRepository: IConferenciaRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SYNC_REPOSITORY)
    private readonly syncRepository: ISyncRepository,
  ) {}

  async execute(
    input: GetRecebimentoV2ProcessesInput,
  ): Promise<GetRecebimentoV2ProcessesResult> {
    let responsavelId: number | undefined;
    if (input.userId != null) {
      const accessible = await this.userRepository.listAccessibleUnidades(
        input.userId,
      );
      const hasAccess = accessible.some((u) => u.id === input.unidadeId);
      if (!hasAccess) {
        return { items: [], nextCursor: null, hasMore: false };
      }

      const user = await this.userRepository.findById(input.userId);
      if (user) {
        responsavelId = resolveOperatorFuncionarioId(user);
      }
    }

    let cursorDate: Date | undefined;
    if (input.cursor) {
      try {
        const decoded = Buffer.from(input.cursor, 'base64url').toString('utf8');
        cursorDate = new Date(decoded);
      } catch {
        cursorDate = undefined;
      }
    }

    const items = await this.conferenciaRepository.listOperadorDemandas({
      unidadeId: input.unidadeId,
      responsavelId,
    });

    const filteredItems = cursorDate
      ? items.filter((item) => item.horarioPrevisto > cursorDate!)
      : items;

    const hasMore = filteredItems.length > input.limit;
    const pageItems = filteredItems.slice(0, input.limit);

    const processHeaders: ProcessHeader[] = await Promise.all(
      pageItems.map(async (item) => {
        const revision = await this.syncRepository.getAggregateRevision(
          'recebimento-v2',
          item.preRecebimentoId,
        );
        const arrival = item.horarioPrevisto.toISOString();

        const atribuidoAMim =
          responsavelId != null &&
          item.alocacaoFuncionarioId != null &&
          item.alocacaoFuncionarioId === responsavelId;

        return {
          demandId: item.preRecebimentoId,
          unidadeId: item.unidadeId,
          situacao: item.situacao,
          preRecebimentoSituacao: item.situacao,
          serverRevision: revision,
          updatedAt: arrival,
          tombstone: false,
          supplier: item.transportadoraNome ?? undefined,
          dock: item.dock ?? undefined,
          arrival,
          placa: item.placa ?? undefined,
          conferente: item.conferente ?? undefined,
          atribuidoAMim: atribuidoAMim || undefined,
        };
      }),
    );

    const lastItem = pageItems[pageItems.length - 1];
    const nextCursor =
      hasMore && lastItem
        ? Buffer.from(lastItem.horarioPrevisto.toISOString()).toString(
            'base64url',
          )
        : null;

    return {
      items: processHeaders,
      nextCursor,
      hasMore,
    };
  }
}
