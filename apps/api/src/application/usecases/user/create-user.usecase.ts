import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import type { CreateUserInput } from '../../../domain/model/user/user.model.js';
import {
  FUNCIONARIO_REPOSITORY,
  type IFuncionarioRepository,
} from '../../../domain/repositories/funcionario/funcionario.repository.js';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';

export type CreateUserUseCaseInput = Omit<CreateUserInput, 'passwordHash'> & {
  password: string;
  unidadesIds?: string[];
};

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(FUNCIONARIO_REPOSITORY)
    private readonly funcionarioRepository: IFuncionarioRepository,
  ) {}

  async execute(input: CreateUserUseCaseInput) {
    const funcionario = await this.funcionarioRepository.findById(
      input.funcionarioId,
    );

    if (!funcionario) {
      throw new NotFoundException(
        `Funcionário ${input.funcionarioId} não encontrado`,
      );
    }

    const existingId = await this.userRepository.findById(input.id);

    if (existingId) {
      throw new ConflictException(`ID "${input.id}" já cadastrado`);
    }

    const existingEmail = await this.userRepository.findByEmail(input.email);

    if (existingEmail) {
      throw new ConflictException(`E-mail "${input.email}" já cadastrado`);
    }

    const activeUser = await this.userRepository.findActiveByFuncionarioId(
      input.funcionarioId,
    );

    if (activeUser && input.status === 'ativo') {
      throw new ConflictException(
        'Já existe um usuário ativo para este funcionário',
      );
    }

    const unidadesIds = this.resolveUnidadesIds(input.unidadesIds, funcionario.unidadeId);

    if (!unidadesIds.includes(funcionario.unidadeId)) {
      throw new BadRequestException(
        'O funcionário deve pertencer a uma das unidades selecionadas',
      );
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await this.userRepository.create({
      id: input.id,
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      status: input.status,
      funcionarioId: input.funcionarioId,
    });

    await this.userRepository.syncUserUnidades(user.id, unidadesIds);

    return user;
  }

  private resolveUnidadesIds(
    unidadesIds: string[] | undefined,
    funcionarioUnidadeId: string,
  ): string[] {
    if (unidadesIds && unidadesIds.length > 0) {
      return [...new Set(unidadesIds.map((id) => id.trim()).filter(Boolean))];
    }

    return [funcionarioUnidadeId];
  }
}
