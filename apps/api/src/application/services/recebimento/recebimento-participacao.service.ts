import { Inject, Injectable } from '@nestjs/common';

import {
  resolveRecebimentoCapabilities,
  assertResponsavelOuApoioRecebimento,
  assertResponsavelRecebimento,
  shouldEnforceOperatorParticipacao,
} from '../../../domain/services/assert-participacao-recebimento.js';
import {
  RECEBIMENTO_ALOCACAO_REPOSITORY,
  type IRecebimentoAlocacaoRepository,
} from '../../../domain/repositories/recebimento/recebimento-alocacao.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';

@Injectable()
export class RecebimentoParticipacaoService {
  constructor(
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(RECEBIMENTO_ALOCACAO_REPOSITORY)
    private readonly recebimentoAlocacaoRepository: IRecebimentoAlocacaoRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  private async resolveUser(userId: number | null) {
    if (userId == null) {
      return null;
    }

    return this.userRepository.findById(userId);
  }

  private async listApoioFuncionarioIds(preRecebimentoId: string): Promise<number[]> {
    const apoios =
      await this.recebimentoAlocacaoRepository.listApoiosByPreRecebimentoId(
        preRecebimentoId,
      );

    return apoios.map((apoio) => apoio.funcionarioId);
  }

  async assertResponsavelForRecebimento(
    recebimentoId: string,
    userId: number | null,
  ): Promise<void> {
    const user = await this.resolveUser(userId);
    if (!user || !shouldEnforceOperatorParticipacao(user)) {
      return;
    }

    const recebimento = await this.recebimentoRepository.findById(recebimentoId);
    if (!recebimento) {
      return;
    }

    assertResponsavelRecebimento(
      { responsavelId: recebimento.responsavelId },
      user.funcionarioId,
    );
  }

  async assertResponsavelOuApoioForRecebimento(
    recebimentoId: string,
    userId: number | null,
  ): Promise<void> {
    const user = await this.resolveUser(userId);
    if (!user || !shouldEnforceOperatorParticipacao(user)) {
      return;
    }

    const recebimento = await this.recebimentoRepository.findById(recebimentoId);
    if (!recebimento) {
      return;
    }

    const apoioFuncionarioIds = await this.listApoioFuncionarioIds(
      recebimento.preRecebimentoId,
    );

    assertResponsavelOuApoioRecebimento(
      { responsavelId: recebimento.responsavelId },
      user.funcionarioId,
      apoioFuncionarioIds,
    );
  }

  async resolveCapabilitiesForRecebimento(
    recebimentoId: string,
    userId: number | null,
  ) {
    const user = await this.resolveUser(userId);
    const recebimento = await this.recebimentoRepository.findById(recebimentoId);

    if (!recebimento) {
      return {
        papelDoUsuario: null as 'responsavel' | 'apoio' | null,
        capabilities: {
          canEditChecklist: false,
          canRegistrarTemperatura: false,
          canFinalizar: false,
          canGerenciarPaletes: false,
          canConferirItens: false,
        },
      };
    }

    const apoioFuncionarioIds = await this.listApoioFuncionarioIds(
      recebimento.preRecebimentoId,
    );

    return resolveRecebimentoCapabilities({
      funcionarioId: user?.funcionarioId,
      responsavelId: recebimento.responsavelId,
      apoioFuncionarioIds,
    });
  }

  async resolveCapabilitiesForPreRecebimento(
    preRecebimentoId: string,
    userId: number | null,
    responsavelId?: number | null,
  ) {
    const user = await this.resolveUser(userId);
    const apoioFuncionarioIds =
      await this.listApoioFuncionarioIds(preRecebimentoId);

    return resolveRecebimentoCapabilities({
      funcionarioId: user?.funcionarioId,
      responsavelId: responsavelId ?? null,
      apoioFuncionarioIds,
    });
  }
}
