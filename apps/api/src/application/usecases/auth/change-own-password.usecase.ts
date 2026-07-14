import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';

export type ChangeOwnPasswordUseCaseInput = {
  currentPassword?: string;
  newPassword: string;
  confirmNewPassword: string;
};

@Injectable()
export class ChangeOwnPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: number, input: ChangeOwnPasswordUseCaseInput) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (input.newPassword.length < 6) {
      throw new BadRequestException(
        'Informe uma senha com no mínimo 6 caracteres',
      );
    }

    if (input.newPassword !== input.confirmNewPassword) {
      throw new BadRequestException('A confirmação da senha não confere');
    }

    if (!user.mustChangePassword) {
      if (!input.currentPassword) {
        throw new BadRequestException('Informe a senha atual');
      }

      const currentPasswordMatch = await bcrypt.compare(
        input.currentPassword,
        user.passwordHash,
      );

      if (!currentPasswordMatch) {
        throw new UnauthorizedException('Senha atual inválida');
      }
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 10);

    const updated = await this.userRepository.update(userId, {
      passwordHash,
      mustChangePassword: false,
    });

    if (!updated) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return { ok: true as const };
  }
}
