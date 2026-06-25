import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';

export type LoginInput = {
  id: number;
  password: string;
};

export type LoginOutput = {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    funcionarioId: number | null;
    unidadeId: string | null;
  };
};

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepository.findById(input.id);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);

    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.status === 'bloqueado') {
      throw new UnauthorizedException('Usuário bloqueado');
    }

    if (user.status === 'inativo') {
      throw new UnauthorizedException('Usuário inativo');
    }

    if (user.status === 'pendente') {
      throw new UnauthorizedException('Usuário pendente de ativação');
    }

    const token = this.jwtService.sign({
      sub: String(user.id),
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        funcionarioId: user.funcionarioId,
        unidadeId: user.unidadeId,
      },
    };
  }
}
