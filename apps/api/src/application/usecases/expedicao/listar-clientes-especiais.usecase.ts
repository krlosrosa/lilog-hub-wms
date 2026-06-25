import { Inject, Injectable } from '@nestjs/common';

import { mapClienteEspecialToResponse } from '../../dtos/expedicao/cliente-especial.dto.js';
import {
  CLIENTE_ESPECIAL_REPOSITORY,
  type IClienteEspecialRepository,
} from '../../../domain/repositories/expedicao/cliente-especial.repository.js';

type ListarClientesEspeciaisInput = {
  unidadeId: string;
  ativo?: boolean;
  search?: string;
  page?: number;
  limit?: number;
};

@Injectable()
export class ListarClientesEspeciaisUseCase {
  constructor(
    @Inject(CLIENTE_ESPECIAL_REPOSITORY)
    private readonly clienteEspecialRepository: IClienteEspecialRepository,
  ) {}

  async execute(input: ListarClientesEspeciaisInput) {
    const result = await this.clienteEspecialRepository.list(input);

    return {
      items: result.items.map(mapClienteEspecialToResponse),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
