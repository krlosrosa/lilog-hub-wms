import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  USUARIO_TERCEIRO_REPOSITORY,
  type IUsuarioTerceiroRepository,
} from '../../../domain/repositories/usuario-terceiro/usuario-terceiro.repository.js';

@Injectable()
export class BlockUsuarioTerceiroUseCase {
  constructor(
    @Inject(USUARIO_TERCEIRO_REPOSITORY)
    private readonly usuarioTerceiroRepository: IUsuarioTerceiroRepository,
  ) {}

  async execute(id: number) {
    const existing = await this.usuarioTerceiroRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }

    const blocked = await this.usuarioTerceiroRepository.block(id);

    if (!blocked) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }

    return blocked;
  }
}
