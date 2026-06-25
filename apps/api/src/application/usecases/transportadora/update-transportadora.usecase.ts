import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  UpdateTransportadoraInputSchema,
  type UpdateTransportadoraInput,
} from '../../../domain/model/transportadora/transportadora.model.js';
import {
  TRANSPORTADORA_REPOSITORY,
  type ITransportadoraRepository,
} from '../../../domain/repositories/transportadora/transportadora.repository.js';

@Injectable()
export class UpdateTransportadoraUseCase {
  constructor(
    @Inject(TRANSPORTADORA_REPOSITORY)
    private readonly transportadoraRepository: ITransportadoraRepository,
  ) {}

  async execute(id: string, data: UpdateTransportadoraInput) {
    const parsed = UpdateTransportadoraInputSchema.parse(data);

    const existing = await this.transportadoraRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Transportadora "${id}" não encontrada`);
    }

    const updated = await this.transportadoraRepository.update(id, parsed);

    if (!updated) {
      throw new NotFoundException(`Transportadora "${id}" não encontrada`);
    }

    return updated;
  }
}
