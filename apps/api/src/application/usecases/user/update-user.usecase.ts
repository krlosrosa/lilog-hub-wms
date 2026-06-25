import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import type { UpdateUserInput } from '../../../domain/model/user/user.model.js';
import {
  FUNCIONARIO_REPOSITORY,
  type IFuncionarioRepository,
} from '../../../domain/repositories/funcionario/funcionario.repository.js';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';

export type UpdateUserUseCaseInput = UpdateUserInput & {
  password?: string;
};

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(FUNCIONARIO_REPOSITORY)
    private readonly funcionarioRepository: IFuncionarioRepository,
  ) {}

  async execute(id: number, input: UpdateUserUseCaseInput) {
    const existing = await this.userRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }

    const data: UpdateUserInput = { ...input };

    if (input.password) {
      data.passwordHash = await bcrypt.hash(input.password, 10);
    }

    if (input.email && input.email !== existing.email) {
      const duplicate = await this.userRepository.findByEmail(input.email);

      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(`E-mail "${input.email}" já cadastrado`);
      }
    }

    if (input.funcionarioId) {
      const funcionario = await this.funcionarioRepository.findById(
        input.funcionarioId,
      );

      if (!funcionario) {
        throw new NotFoundException(
          `Funcionário ${input.funcionarioId} não encontrado`,
        );
      }
    }

    if (input.status === 'ativo' || input.funcionarioId) {
      const funcionarioId = input.funcionarioId ?? existing.funcionarioId;

      if (funcionarioId) {
        const activeUser =
          await this.userRepository.findActiveByFuncionarioId(funcionarioId);

        if (activeUser && activeUser.id !== id) {
          throw new ConflictException(
            'Já existe um usuário ativo para este funcionário',
          );
        }
      }
    }

    const updated = await this.userRepository.update(id, data);

    if (!updated) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }

    return updated;
  }
}
