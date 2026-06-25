import {
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';

import type { CreateUnidadeInput } from '../../../domain/model/unidade/unidade.model.js';
import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';

@Injectable()
export class CreateUnidadeUseCase {
  constructor(
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
  ) {}

  async execute(data: CreateUnidadeInput) {
    const existing = await this.unidadeRepository.findById(data.id);

    if (existing) {
      throw new ConflictException(
        `Unidade com ID "${data.id}" já existe`,
      );
    }

    return this.unidadeRepository.create(data);
  }
}
