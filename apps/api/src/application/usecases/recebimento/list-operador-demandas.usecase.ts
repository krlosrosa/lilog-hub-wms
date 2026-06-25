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
import {
  USER_REPOSITORY,
  type IUserRepository,
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
    const unidadeId = await this.resolveUnidadeId(input);
    const items = await this.conferenciaRepository.listOperadorDemandas({
      unidadeId,
    } satisfies ListOperadorDemandasFilter);

    return {
      items: items.map((item) => ({
        ...item,
        horarioPrevisto: item.horarioPrevisto.toISOString(),
      })),
    };
  }

  private async resolveUnidadeId(
    input: ListOperadorDemandasInput,
  ): Promise<string> {
    const fromQuery = input.unidadeId?.trim();
    if (fromQuery) {
      return fromQuery;
    }

    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
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
