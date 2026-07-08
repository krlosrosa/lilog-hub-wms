import {
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import type { CreateUsuarioTerceiroInput } from '../../../domain/model/usuario-terceiro/usuario-terceiro.model.js';
import {
  USUARIO_TERCEIRO_REPOSITORY,
  type IUsuarioTerceiroRepository,
} from '../../../domain/repositories/usuario-terceiro/usuario-terceiro.repository.js';

export type CreateUsuarioTerceiroUseCaseInput = Omit<
  CreateUsuarioTerceiroInput,
  'passwordHash'
> & {
  password: string;
};

@Injectable()
export class CreateUsuarioTerceiroUseCase {
  constructor(
    @Inject(USUARIO_TERCEIRO_REPOSITORY)
    private readonly usuarioTerceiroRepository: IUsuarioTerceiroRepository,
  ) {}

  async execute(input: CreateUsuarioTerceiroUseCaseInput) {
    const existingEmail = await this.usuarioTerceiroRepository.findByEmail(
      input.email,
    );

    if (existingEmail) {
      throw new ConflictException(`E-mail "${input.email}" já cadastrado`);
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    return this.usuarioTerceiroRepository.create({
      nome: input.nome,
      email: input.email,
      passwordHash,
      role: input.role,
      status: input.status,
    });
  }
}
