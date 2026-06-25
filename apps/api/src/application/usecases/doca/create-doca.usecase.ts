import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CreateDocaInputSchema,
  type CreateDocaInput,
} from '../../../domain/model/doca/doca.model.js';
import { DOCA_EVENT } from '../../../domain/model/doca/doca.events.js';
import {
  DOCA_REPOSITORY,
  type IDocaRepository,
} from '../../../domain/repositories/doca/doca.repository.js';
import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';
import { DocaEventPublisher } from '../../services/doca-event.publisher.js';

export type CreateDocaUseCaseInput = {
  data: CreateDocaInput;
  userId: number | null;
};

@Injectable()
export class CreateDocaUseCase {
  constructor(
    @Inject(DOCA_REPOSITORY)
    private readonly docaRepository: IDocaRepository,
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
    private readonly docaEventPublisher: DocaEventPublisher,
  ) {}

  async execute({ data, userId }: CreateDocaUseCaseInput) {
    const parsed = CreateDocaInputSchema.parse(data);

    const unidade = await this.unidadeRepository.findById(parsed.unidadeId);

    if (!unidade) {
      throw new NotFoundException(
        `Unidade "${parsed.unidadeId}" não encontrada`,
      );
    }

    const existing = await this.docaRepository.findByUnidadeAndCodigo(
      parsed.unidadeId,
      parsed.codigo,
    );

    if (existing) {
      throw new ConflictException(
        `Doca com código "${parsed.codigo}" já existe nesta unidade`,
      );
    }

    const created = await this.docaRepository.create(parsed);

    await this.docaEventPublisher.publish({
      type: DOCA_EVENT.CADASTRADA,
      docaId: created.id,
      unidadeId: created.unidadeId,
      userId,
    });

    return created;
  }
}
