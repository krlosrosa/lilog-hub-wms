import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  USUARIO_TERCEIRO_REPOSITORY,
  type IUsuarioTerceiroRepository,
} from '../../../domain/repositories/usuario-terceiro/usuario-terceiro.repository.js';

export type GetMePortalOutput = {
  id: number;
  nome: string;
  email: string;
  role: string;
  status: string;
};

@Injectable()
export class GetMePortalUseCase {
  constructor(
    @Inject(USUARIO_TERCEIRO_REPOSITORY)
    private readonly usuarioTerceiroRepository: IUsuarioTerceiroRepository,
  ) {}

  async execute(userId: number): Promise<GetMePortalOutput> {
    const user = await this.usuarioTerceiroRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }
}
