import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  TRANSPORTADORA_REPOSITORY,
  type ITransportadoraRepository,
} from '../../../domain/repositories/transportadora/transportadora.repository.js';

@Injectable()
export class DeleteTransportadoraUseCase {
  constructor(
    @Inject(TRANSPORTADORA_REPOSITORY)
    private readonly transportadoraRepository: ITransportadoraRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.transportadoraRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Transportadora "${id}" não encontrada`);
    }

    await this.transportadoraRepository.delete(id);
  }
}
