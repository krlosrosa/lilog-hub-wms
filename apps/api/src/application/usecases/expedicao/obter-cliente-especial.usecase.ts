import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { mapClienteEspecialToResponse } from '../../dtos/expedicao/cliente-especial.dto.js';
import {
  CLIENTE_ESPECIAL_REPOSITORY,
  type IClienteEspecialRepository,
} from '../../../domain/repositories/expedicao/cliente-especial.repository.js';

@Injectable()
export class ObterClienteEspecialUseCase {
  constructor(
    @Inject(CLIENTE_ESPECIAL_REPOSITORY)
    private readonly clienteEspecialRepository: IClienteEspecialRepository,
  ) {}

  async execute(id: string) {
    const record = await this.clienteEspecialRepository.findById(id);

    if (!record) {
      throw new NotFoundException('Cliente especial não encontrado');
    }

    return mapClienteEspecialToResponse(record);
  }
}
