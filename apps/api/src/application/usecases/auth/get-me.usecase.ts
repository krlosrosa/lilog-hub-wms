import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';

export type GetMeOutput = {
  id: number;
  name: string;
  email: string;
  role: string;
  funcionarioId: number | null;
  unidadeId: string | null;
};

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: number): Promise<GetMeOutput> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      funcionarioId: user.funcionarioId,
      unidadeId: user.unidadeId,
    };
  }
}
