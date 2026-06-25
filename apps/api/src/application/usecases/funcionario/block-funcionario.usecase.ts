import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  FUNCIONARIO_REPOSITORY,
  type IFuncionarioRepository,
} from '../../../domain/repositories/funcionario/funcionario.repository.js';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';

@Injectable()
export class BlockFuncionarioUseCase {
  constructor(
    @Inject(FUNCIONARIO_REPOSITORY)
    private readonly funcionarioRepository: IFuncionarioRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: number) {
    const existing = await this.funcionarioRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Funcionário ${id} não encontrado`);
    }

    const updated = await this.funcionarioRepository.update(id, {
      situacao: 'bloqueado',
    });

    if (!updated) {
      throw new NotFoundException(`Funcionário ${id} não encontrado`);
    }

    await this.userRepository.blockByFuncionarioId(id);

    return updated;
  }
}
