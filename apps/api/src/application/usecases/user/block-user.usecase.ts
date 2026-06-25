import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';

@Injectable()
export class BlockUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: number) {
    const existing = await this.userRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }

    const updated = await this.userRepository.block(id);

    if (!updated) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }

    return updated;
  }
}
