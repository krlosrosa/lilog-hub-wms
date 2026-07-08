import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import type { UpdateUsuarioTerceiroInput } from '../../../domain/model/usuario-terceiro/usuario-terceiro.model.js';
import {
  USUARIO_TERCEIRO_REPOSITORY,
  type IUsuarioTerceiroRepository,
} from '../../../domain/repositories/usuario-terceiro/usuario-terceiro.repository.js';

export type UpdateUsuarioTerceiroUseCaseInput = Omit<
  UpdateUsuarioTerceiroInput,
  'passwordHash'
> & {
  password?: string;
};

@Injectable()
export class UpdateUsuarioTerceiroUseCase {
  constructor(
    @Inject(USUARIO_TERCEIRO_REPOSITORY)
    private readonly usuarioTerceiroRepository: IUsuarioTerceiroRepository,
  ) {}

  async execute(id: number, input: UpdateUsuarioTerceiroUseCaseInput) {
    const existing = await this.usuarioTerceiroRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }

    if (input.email && input.email.toLowerCase() !== existing.email) {
      const emailTaken = await this.usuarioTerceiroRepository.findByEmail(
        input.email,
      );

      if (emailTaken) {
        throw new ConflictException(`E-mail "${input.email}" já cadastrado`);
      }
    }

    const data: UpdateUsuarioTerceiroInput = {
      nome: input.nome,
      email: input.email,
      role: input.role,
      status: input.status,
    };

    if (input.password) {
      data.passwordHash = await bcrypt.hash(input.password, 10);
    }

    const updated = await this.usuarioTerceiroRepository.update(id, data);

    if (!updated) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }

    return updated;
  }
}
