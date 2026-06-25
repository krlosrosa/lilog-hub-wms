import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';

@Injectable()
export class UnblockUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: number) {
    const existing = await this.userRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }

    if (existing.funcionarioId) {
      const activeUser = await this.userRepository.findActiveByFuncionarioId(
        existing.funcionarioId,
      );

      if (activeUser && activeUser.id !== id) {
        throw new ConflictException(
          'Já existe um usuário ativo para este funcionário',
        );
      }
    }

    const updated = await this.userRepository.unblock(id);

    if (!updated) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }

    return updated;
  }
}
