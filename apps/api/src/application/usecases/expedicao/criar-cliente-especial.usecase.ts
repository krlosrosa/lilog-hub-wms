import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { mapClienteEspecialToResponse } from '../../dtos/expedicao/cliente-especial.dto.js';
import { CreateClienteEspecialInputSchema } from '../../../domain/model/expedicao/cliente-especial.model.js';
import {
  CLIENTE_ESPECIAL_REPOSITORY,
  type IClienteEspecialRepository,
} from '../../../domain/repositories/expedicao/cliente-especial.repository.js';
import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';

@Injectable()
export class CriarClienteEspecialUseCase {
  constructor(
    @Inject(CLIENTE_ESPECIAL_REPOSITORY)
    private readonly clienteEspecialRepository: IClienteEspecialRepository,
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
  ) {}

  async execute(data: unknown) {
    const parsed = CreateClienteEspecialInputSchema.parse(data);

    const unidade = await this.unidadeRepository.findById(parsed.unidadeId);

    if (!unidade) {
      throw new NotFoundException(
        `Unidade "${parsed.unidadeId}" não encontrada`,
      );
    }

    const existente =
      await this.clienteEspecialRepository.findByUnidadeAndCodCliente(
        parsed.unidadeId,
        parsed.codCliente.trim(),
      );

    if (existente) {
      throw new ConflictException(
        `Já existe um cliente especial com o código "${parsed.codCliente.trim()}" nesta unidade`,
      );
    }

    const created = await this.clienteEspecialRepository.create({
      ...parsed,
      codCliente: parsed.codCliente.trim(),
      nomeCliente: parsed.nomeCliente.trim(),
    });

    return mapClienteEspecialToResponse(created);
  }
}
