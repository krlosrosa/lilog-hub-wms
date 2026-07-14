import {
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';

import {
  CreateCentroOrigemInputSchema,
  type CreateCentroOrigemInput,
} from '../../../domain/model/centro-origem/centro-origem.model.js';
import {
  CENTRO_ORIGEM_REPOSITORY,
  type ICentroOrigemRepository,
} from '../../../domain/repositories/centro-origem/centro-origem.repository.js';

@Injectable()
export class CreateCentroOrigemUseCase {
  constructor(
    @Inject(CENTRO_ORIGEM_REPOSITORY)
    private readonly centroOrigemRepository: ICentroOrigemRepository,
  ) {}

  async execute(data: CreateCentroOrigemInput) {
    const parsed = CreateCentroOrigemInputSchema.parse(data);

    const existing = await this.centroOrigemRepository.findById(parsed.centro);

    if (existing) {
      throw new ConflictException(
        `Centro de origem "${parsed.centro}" já existe`,
      );
    }

    return this.centroOrigemRepository.create(parsed);
  }
}
