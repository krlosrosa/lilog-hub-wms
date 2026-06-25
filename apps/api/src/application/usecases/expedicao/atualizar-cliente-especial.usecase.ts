import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { mapClienteEspecialToResponse } from '../../dtos/expedicao/cliente-especial.dto.js';
import { UpdateClienteEspecialInputSchema } from '../../../domain/model/expedicao/cliente-especial.model.js';
import {
  CLIENTE_ESPECIAL_REPOSITORY,
  type IClienteEspecialRepository,
} from '../../../domain/repositories/expedicao/cliente-especial.repository.js';

type AtualizarClienteEspecialInput = {
  id: string;
  data: unknown;
};

@Injectable()
export class AtualizarClienteEspecialUseCase {
  constructor(
    @Inject(CLIENTE_ESPECIAL_REPOSITORY)
    private readonly clienteEspecialRepository: IClienteEspecialRepository,
  ) {}

  async execute(input: AtualizarClienteEspecialInput) {
    const parsed = UpdateClienteEspecialInputSchema.parse(input.data);

    const existente = await this.clienteEspecialRepository.findById(input.id);

    if (!existente) {
      throw new NotFoundException('Cliente especial não encontrado');
    }

    if (parsed.codCliente !== undefined) {
      const codCliente = parsed.codCliente.trim();
      const conflito =
        await this.clienteEspecialRepository.findByUnidadeAndCodCliente(
          existente.unidadeId,
          codCliente,
        );

      if (conflito && conflito.id !== input.id) {
        throw new ConflictException(
          `Já existe um cliente especial com o código "${codCliente}" nesta unidade`,
        );
      }
    }

    const updated = await this.clienteEspecialRepository.update(
      input.id,
      {
        ...parsed,
        codCliente: parsed.codCliente?.trim(),
        nomeCliente: parsed.nomeCliente?.trim(),
      },
    );

    if (!updated) {
      throw new NotFoundException('Cliente especial não encontrado');
    }

    return mapClienteEspecialToResponse(updated);
  }
}
