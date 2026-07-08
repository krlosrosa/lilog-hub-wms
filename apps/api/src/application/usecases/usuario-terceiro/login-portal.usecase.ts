import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import {
  USUARIO_TERCEIRO_REPOSITORY,
  type IUsuarioTerceiroRepository,
} from '../../../domain/repositories/usuario-terceiro/usuario-terceiro.repository.js';

export type LoginPortalInput = {
  email: string;
  password: string;
};

export type LoginPortalOutput = {
  token: string;
  user: {
    id: number;
    nome: string;
    email: string;
    role: string;
  };
};

@Injectable()
export class LoginPortalUseCase {
  constructor(
    @Inject(USUARIO_TERCEIRO_REPOSITORY)
    private readonly usuarioTerceiroRepository: IUsuarioTerceiroRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(input: LoginPortalInput): Promise<LoginPortalOutput> {
    const user = await this.usuarioTerceiroRepository.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.status === 'bloqueado') {
      throw new UnauthorizedException('Usuário bloqueado');
    }

    if (user.status === 'inativo') {
      throw new UnauthorizedException('Usuário inativo');
    }

    const token = this.jwtService.sign({
      sub: String(user.id),
      email: user.email,
      role: user.role,
      type: 'portal',
    });

    return {
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
      },
    };
  }
}
