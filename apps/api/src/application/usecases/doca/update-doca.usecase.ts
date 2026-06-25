import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  UpdateDocaInputSchema,
  type UpdateDocaInput,
} from '../../../domain/model/doca/doca.model.js';
import {
  DOCA_REPOSITORY,
  type IDocaRepository,
} from '../../../domain/repositories/doca/doca.repository.js';

export type UpdateDocaUseCaseInput = {
  id: string;
  data: UpdateDocaInput;
};

@Injectable()
export class UpdateDocaUseCase {
  constructor(
    @Inject(DOCA_REPOSITORY)
    private readonly docaRepository: IDocaRepository,
  ) {}

  async execute({ id, data }: UpdateDocaUseCaseInput) {
    const parsed = UpdateDocaInputSchema.parse(data);

    const existing = await this.docaRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Doca "${id}" não encontrada`);
    }

    if (parsed.codigo && parsed.codigo !== existing.codigo) {
      const duplicate = await this.docaRepository.findByUnidadeAndCodigo(
        existing.unidadeId,
        parsed.codigo,
      );

      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `Doca com código "${parsed.codigo}" já existe nesta unidade`,
        );
      }
    }

    const updated = await this.docaRepository.update(id, parsed);

    if (!updated) {
      throw new NotFoundException(`Doca "${id}" não encontrada`);
    }

    return updated;
  }
}
