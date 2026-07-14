import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  UpdateCentroOrigemInputSchema,
  type UpdateCentroOrigemInput,
} from '../../../domain/model/centro-origem/centro-origem.model.js';
import {
  CENTRO_ORIGEM_REPOSITORY,
  type ICentroOrigemRepository,
} from '../../../domain/repositories/centro-origem/centro-origem.repository.js';

@Injectable()
export class UpdateCentroOrigemUseCase {
  constructor(
    @Inject(CENTRO_ORIGEM_REPOSITORY)
    private readonly centroOrigemRepository: ICentroOrigemRepository,
  ) {}

  async execute(centro: string, data: UpdateCentroOrigemInput) {
    const parsed = UpdateCentroOrigemInputSchema.parse(data);

    const updated = await this.centroOrigemRepository.update(centro, parsed);

    if (!updated) {
      throw new NotFoundException(`Centro de origem "${centro}" não encontrado`);
    }

    return updated;
  }
}
