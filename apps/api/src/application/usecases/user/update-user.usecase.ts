import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import type { UpdateUserInput } from '../../../domain/model/user/user.model.js';
import {
  FUNCIONARIO_REPOSITORY,
  type IFuncionarioRepository,
} from '../../../domain/repositories/funcionario/funcionario.repository.js';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';
import { normalizePersonName } from '../../../shared/utils/normalize-person-name.js';

export type UpdateUserUseCaseInput = UpdateUserInput & {
  password?: string;
  unidadesIds?: string[];
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

    const { unidadesIds, password, ...updateFields } = input;
    const data: UpdateUserInput = { ...updateFields };

    if (input.name !== undefined) {
      data.name = normalizePersonName(input.name);
    }

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
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

      if (unidadesIds && unidadesIds.length > 0) {
        const normalizedUnidadesIds = [
          ...new Set(unidadesIds.map((id) => id.trim()).filter(Boolean)),
        ];

        if (!normalizedUnidadesIds.includes(funcionario.unidadeId)) {
          throw new BadRequestException(
            'O funcionário deve pertencer a uma das unidades selecionadas',
          );
        }
      }
    }

    const nextRole = input.role ?? existing.role;
    const nextFuncionarioId =
      input.funcionarioId !== undefined
        ? input.funcionarioId
        : existing.funcionarioId;

    if (nextRole === 'operator' && nextFuncionarioId == null) {
      throw new BadRequestException(
        'Usuário operador deve ter um funcionário vinculado',
      );
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

    if (unidadesIds !== undefined) {
      const normalizedUnidadesIds = [
        ...new Set(unidadesIds.map((unidadeId) => unidadeId.trim()).filter(Boolean)),
      ];

      if (normalizedUnidadesIds.length === 0) {
        throw new BadRequestException('Informe ao menos uma unidade');
      }

      await this.userRepository.syncUserUnidades(id, normalizedUnidadesIds);
    }

    return updated;
  }
}
