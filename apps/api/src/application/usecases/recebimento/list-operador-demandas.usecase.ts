import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CONFERENCIA_REPOSITORY,
  type IConferenciaRepository,
  type ListOperadorDemandasFilter,
} from '../../../domain/repositories/recebimento/conferencia.repository.js';
import { resolveOperatorFuncionarioId } from '../../../domain/services/assert-operator-funcionario.js';
import {
  USER_REPOSITORY,
  type IUserRepository,
  type UserRecord,
} from '../../../domain/repositories/user/user.repository.js';

export type ListOperadorDemandasInput = {
  unidadeId?: string;
  userId: number;
};

@Injectable()
export class ListOperadorDemandasUseCase {
  constructor(
    @Inject(CONFERENCIA_REPOSITORY)
    private readonly conferenciaRepository: IConferenciaRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: ListOperadorDemandasInput) {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const unidadeId = await this.resolveUnidadeId(input, user);
    const funcionarioId = resolveOperatorFuncionarioId(user);
    const items = await this.conferenciaRepository.listOperadorDemandas({
      unidadeId,
      responsavelId: funcionarioId,
    } satisfies ListOperadorDemandasFilter);

    return {
      items: items.map((item) => ({
        ...item,
        horarioPrevisto: item.horarioPrevisto.toISOString(),
        atribuidoAMim:
          item.alocacaoFuncionarioId != null &&
          funcionarioId != null &&
          item.alocacaoFuncionarioId === funcionarioId,
      })),
    };
  }

  private async resolveUnidadeId(
    input: ListOperadorDemandasInput,
    user: UserRecord,
  ): Promise<string> {
    const fromQuery = input.unidadeId?.trim();
    if (fromQuery) {
      return fromQuery;
    }

    if (user.unidadeId) {
      return user.unidadeId;
    }

    const accessible = await this.userRepository.listAccessibleUnidades(user.id);
    const fallback = accessible[0]?.id?.trim();
    if (fallback) {
      return fallback;
    }

    throw new BadRequestException(
      'unidadeId é obrigatório para listar demandas do operador',
    );
  }
}
