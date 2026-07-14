import { Inject, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { WEB_CLIENT_APP } from '../../../shared/constants/client-apps.js';
import {
  canAccessLiderancaPwa,
  LIDERANCA_PWA_CLIENT_APP,
} from '../../../shared/constants/lideranca-permissions.js';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';

export type LoginInput = {
  id: number;
  password: string;
  clientApp?: string;
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
    mustChangePassword: boolean;
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

    const isWebPortal = input.clientApp === WEB_CLIENT_APP;

    if (
      !isWebPortal &&
      (user.role === 'operator' || user.role === 'leader') &&
      user.funcionarioId == null
    ) {
      throw new UnauthorizedException(
        'Conta operador sem funcionário vinculado. Contate o administrador.',
      );
    }

    if (
      input.clientApp === LIDERANCA_PWA_CLIENT_APP &&
      !canAccessLiderancaPwa(user.role)
    ) {
      throw new ForbiddenException('Acesso restrito ao painel de liderança');
    }

    const token = this.jwtService.sign({
      sub: String(user.id),
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
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
        mustChangePassword: user.mustChangePassword,
      },
    };
  }
}
