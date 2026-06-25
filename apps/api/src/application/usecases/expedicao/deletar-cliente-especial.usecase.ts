import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CLIENTE_ESPECIAL_REPOSITORY,
  type IClienteEspecialRepository,
} from '../../../domain/repositories/expedicao/cliente-especial.repository.js';

@Injectable()
export class DeletarClienteEspecialUseCase {
  constructor(
    @Inject(CLIENTE_ESPECIAL_REPOSITORY)
    private readonly clienteEspecialRepository: IClienteEspecialRepository,
  ) {}

  async execute(id: string) {
    const existente = await this.clienteEspecialRepository.findById(id);

    if (!existente) {
      throw new NotFoundException('Cliente especial não encontrado');
    }

    await this.clienteEspecialRepository.delete(id);
  }
}
