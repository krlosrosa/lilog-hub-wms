import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { UpdateFuncionarioInput } from '../../../domain/model/funcionario/funcionario.model.js';
import {
  FUNCIONARIO_REPOSITORY,
  type IFuncionarioRepository,
} from '../../../domain/repositories/funcionario/funcionario.repository.js';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';
import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';

@Injectable()
export class UpdateFuncionarioUseCase {
  constructor(
    @Inject(FUNCIONARIO_REPOSITORY)
    private readonly funcionarioRepository: IFuncionarioRepository,
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: number, data: UpdateFuncionarioInput) {
    const existing = await this.funcionarioRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Funcionário ${id} não encontrado`);
    }

    if (data.unidadeId && data.unidadeId !== existing.unidadeId) {
      const unidade = await this.unidadeRepository.findById(data.unidadeId);

      if (!unidade) {
        throw new NotFoundException(
          `Unidade "${data.unidadeId}" não encontrada`,
        );
      }
    }

    const unidadeId = data.unidadeId ?? existing.unidadeId;
    const matricula = data.matricula ?? existing.matricula;

    if (data.matricula || data.unidadeId) {
      const duplicate = await this.funcionarioRepository.findByMatricula(
        unidadeId,
        matricula,
      );

      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `Matrícula "${matricula}" já existe nesta unidade`,
        );
      }
    }

    const updated = await this.funcionarioRepository.update(id, data);

    if (!updated) {
      throw new NotFoundException(`Funcionário ${id} não encontrado`);
    }

    if (data.situacao === 'desligado') {
      await this.userRepository.blockByFuncionarioId(id);
    }

    return updated;
  }
}
