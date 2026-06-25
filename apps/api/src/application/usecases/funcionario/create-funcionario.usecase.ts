import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { CreateFuncionarioInput } from '../../../domain/model/funcionario/funcionario.model.js';
import {
  FUNCIONARIO_REPOSITORY,
  type IFuncionarioRepository,
} from '../../../domain/repositories/funcionario/funcionario.repository.js';
import type { UserRecord } from '../../../domain/repositories/user/user.repository.js';
import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';
import { CreateUserUseCase } from '../user/create-user.usecase.js';

export type CreateFuncionarioUseCaseInput = CreateFuncionarioInput & {
  criarUsuarioAdmin?: boolean;
  usuarioSenha?: string;
};

export type CreateFuncionarioUseCaseResult = {
  funcionario: Awaited<ReturnType<IFuncionarioRepository['create']>>;
  usuario?: UserRecord;
};

@Injectable()
export class CreateFuncionarioUseCase {
  constructor(
    @Inject(FUNCIONARIO_REPOSITORY)
    private readonly funcionarioRepository: IFuncionarioRepository,
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
    private readonly createUserUseCase: CreateUserUseCase,
  ) {}

  async execute(
    data: CreateFuncionarioUseCaseInput,
  ): Promise<CreateFuncionarioUseCaseResult> {
    const { criarUsuarioAdmin, usuarioSenha, ...funcionarioData } = data;

    if (criarUsuarioAdmin) {
      if (!usuarioSenha || usuarioSenha.length < 6) {
        throw new BadRequestException(
          'Informe uma senha com no mínimo 6 caracteres',
        );
      }
    }

    const unidade = await this.unidadeRepository.findById(
      funcionarioData.unidadeId,
    );

    if (!unidade) {
      throw new NotFoundException(
        `Unidade "${funcionarioData.unidadeId}" não encontrada`,
      );
    }

    const existingMatricula = await this.funcionarioRepository.findByMatricula(
      funcionarioData.unidadeId,
      funcionarioData.matricula,
    );

    if (existingMatricula) {
      throw new ConflictException(
        `Matrícula "${funcionarioData.matricula}" já existe nesta unidade`,
      );
    }

    const funcionario = await this.funcionarioRepository.create(funcionarioData);

    if (!criarUsuarioAdmin) {
      return { funcionario };
    }

    const loginId = Number(funcionarioData.matricula);

    if (!Number.isInteger(loginId) || loginId <= 0) {
      throw new BadRequestException(
        'A matrícula deve ser um ID numérico válido para login',
      );
    }

    const usuarioEmail =
      funcionarioData.email?.trim() || `${loginId}@acesso.local`;

    const usuario = await this.createUserUseCase.execute({
      id: loginId,
      name: funcionarioData.nome,
      email: usuarioEmail,
      password: usuarioSenha!,
      role: 'admin',
      status: 'ativo',
      funcionarioId: funcionario.id,
    });

    return { funcionario, usuario };
  }
}
