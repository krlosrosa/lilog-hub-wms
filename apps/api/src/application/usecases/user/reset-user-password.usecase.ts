import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';

export type ResetUserPasswordUseCaseInput = {
  password: string;
};

@Injectable()
export class ResetUserPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: number, input: ResetUserPasswordUseCaseInput) {
    const existing = await this.userRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }

    if (input.password.length < 6) {
      throw new BadRequestException(
        'Informe uma senha com no mínimo 6 caracteres',
      );
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const updated = await this.userRepository.update(id, {
      passwordHash,
      mustChangePassword: true,
    });

    if (!updated) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }

    return updated;
  }
}
