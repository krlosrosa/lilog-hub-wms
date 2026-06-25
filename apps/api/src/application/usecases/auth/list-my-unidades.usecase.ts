import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';

@Injectable()
export class ListMyUnidadesUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: number) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const items = await this.userRepository.listAccessibleUnidades(userId);

    return { items };
  }
}
